import mysql from 'mysql2/promise';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  console.log('🚀 Initializing TrustBridge database...\n');

  let connection: mysql.Connection | null = null;

  try {
    // Create connection without selecting a database first
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      multipleStatements: true,
      ...(config.database.ssl && {
        ssl: {
          rejectUnauthorized: false
        }
      })
    });

    console.log('✅ Connected to MySQL server\n');

    // Read the Base Sepolia EVM schema SQL file
    const sqlPath = join(__dirname, '../../sql/base-sepolia-schema.sql');
    console.log(`📄 Reading SQL file: ${sqlPath}`);
    const sqlContent = await readFile(sqlPath, 'utf-8');

    // Drop old views and tables if they exist
    console.log('🗑️  Cleaning up old Cardano tables and views...');

    // Drop views first (they depend on tables)
    const oldViews = ['v_active_tokens', 'v_recent_swaps', 'v_transaction_history', 'v_transfer_history', 'v_active_evm_tokens'];
    for (const view of oldViews) {
      try {
        await connection.query(`DROP VIEW IF EXISTS ${view}`);
      } catch (error) {
        // Ignore errors
      }
    }

    // Drop old Cardano tables (with dependencies)
    const oldTables = ['cardano_swaps', 'cardano_mints', 'cardano_tokens', 'users', 'transfers', 'transactions', 'evm_swaps', 'evm_tokens', 'smart_contracts'];
    for (const table of oldTables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✅ Dropped ${table}`);
      } catch (error) {
        // Ignore errors if tables don't exist
      }
    }
    console.log('');

    // Split SQL content by statements, filtering out comments and empty lines
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Filter out empty statements and comment-only lines
        if (!stmt) return false;
        const lines = stmt.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('--');
        });
        return lines.length > 0;
      });

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip delimiter commands
      if (statement.toUpperCase().includes('DELIMITER')) {
        skipCount++;
        continue;
      }

      // Skip stored procedure/trigger definitions for now (they have complex syntax)
      if (
        statement.toUpperCase().includes('CREATE PROCEDURE') ||
        statement.toUpperCase().includes('CREATE TRIGGER')
      ) {
        console.log(`⏭️  Skipping stored procedure/trigger (${i + 1}/${statements.length})`);
        skipCount++;
        continue;
      }

      try {
        // Execute the statement
        await connection.query(statement + ';');
        successCount++;

        // Show progress for important statements
        if (
          statement.toUpperCase().includes('CREATE TABLE') ||
          statement.toUpperCase().includes('CREATE DATABASE') ||
          statement.toUpperCase().includes('CREATE VIEW') ||
          statement.toUpperCase().includes('USE ')
        ) {
          const firstLine = statement.split('\n')[0].substring(0, 80);
          console.log(`✅ Executed: ${firstLine}...`);
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.code === 'ER_TABLE_EXISTS_ERROR' ||
          error.code === 'ER_DB_CREATE_EXISTS' ||
          error.message?.includes('already exists')
        ) {
          skipCount++;
          continue;
        }

        console.error(`\n❌ Error executing statement ${i + 1}:`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        console.error(`Error: ${error.message}\n`);
      }
    }

    console.log('\n📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   📝 Total: ${statements.length}\n`);

    // Verify tables were created
    console.log('🔍 Verifying database structure...');
    await connection.query(`USE ${config.database.name}`);
    const [tables] = await connection.query('SHOW TABLES');

    console.log(`\n✅ Database initialized successfully!`);
    console.log(`📊 Total tables created: ${(tables as any[]).length}\n`);

    if ((tables as any[]).length > 0) {
      console.log('Tables:');
      (tables as any[]).forEach((table, idx) => {
        console.log(`   ${idx + 1}. ${Object.values(table)[0]}`);
      });
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run start');
    console.log('   2. Check API health: http://localhost:3000/health');
    console.log('   3. Import token data if needed\n');

  } catch (error: any) {
    console.error('\n❌ Database initialization failed:');
    console.error(`Error: ${error.message}`);
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed');
    }
  }
}

// Run initialization
initializeDatabase();
