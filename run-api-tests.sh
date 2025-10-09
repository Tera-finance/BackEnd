#!/bin/bash

# TrustBridge API - Postman Collection Test Runner
# Uses Newman CLI to run automated API tests
# 
# Prerequisites:
#   npm install -g newman newman-reporter-htmlextra

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COLLECTION_FILE="TrustBridge_API.postman_collection.json"
BASE_URL="${BASE_URL:-http://localhost:3000}"
REPORT_DIR="./test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if server is running
check_server() {
    print_info "Checking if server is running at ${BASE_URL}..."
    
    if curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health" | grep -q "200"; then
        print_success "Server is running!"
        return 0
    else
        print_error "Server is not running at ${BASE_URL}"
        print_info "Please start the server first:"
        echo "  cd backend-trustbridge && npm run dev"
        return 1
    fi
}

# Function to check Newman installation
check_newman() {
    if ! command -v newman &> /dev/null; then
        print_error "Newman is not installed"
        print_info "Install Newman globally:"
        echo "  npm install -g newman newman-reporter-htmlextra"
        return 1
    fi
    
    print_success "Newman is installed ($(newman --version))"
    return 0
}

# Function to run basic tests
run_basic_tests() {
    print_info "Running basic API tests..."
    
    newman run "${COLLECTION_FILE}" \
        --env-var "baseUrl=${BASE_URL}" \
        --color on \
        --reporters cli \
        --bail
}

# Function to run tests with HTML report
run_tests_with_report() {
    print_info "Running tests with HTML report generation..."
    
    # Create report directory
    mkdir -p "${REPORT_DIR}"
    
    newman run "${COLLECTION_FILE}" \
        --env-var "baseUrl=${BASE_URL}" \
        --reporters cli,htmlextra \
        --reporter-htmlextra-export "${REPORT_DIR}/report_${TIMESTAMP}.html" \
        --reporter-htmlextra-darkTheme \
        --color on
    
    if [ $? -eq 0 ]; then
        print_success "Tests completed! Report saved to:"
        echo "  ${REPORT_DIR}/report_${TIMESTAMP}.html"
        
        # Open report in browser (macOS/Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "${REPORT_DIR}/report_${TIMESTAMP}.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "${REPORT_DIR}/report_${TIMESTAMP}.html" 2>/dev/null || \
            print_info "Open the report manually: ${REPORT_DIR}/report_${TIMESTAMP}.html"
        fi
    fi
}

# Function to run specific folder
run_folder_tests() {
    local folder=$1
    print_info "Running tests for folder: ${folder}"
    
    newman run "${COLLECTION_FILE}" \
        --env-var "baseUrl=${BASE_URL}" \
        --folder "${folder}" \
        --color on \
        --reporters cli
}

# Function to run with iterations (load testing)
run_load_tests() {
    local iterations=${1:-10}
    print_info "Running load tests with ${iterations} iterations..."
    
    newman run "${COLLECTION_FILE}" \
        --env-var "baseUrl=${BASE_URL}" \
        --iteration-count "${iterations}" \
        --reporters cli,htmlextra \
        --reporter-htmlextra-export "${REPORT_DIR}/load_test_${TIMESTAMP}.html" \
        --color on
}

# Function to run in CI/CD mode
run_ci_tests() {
    print_info "Running in CI/CD mode..."
    
    newman run "${COLLECTION_FILE}" \
        --env-var "baseUrl=${BASE_URL}" \
        --reporters cli,json \
        --reporter-json-export "${REPORT_DIR}/results_${TIMESTAMP}.json" \
        --color off \
        --bail
}

# Function to show usage
show_usage() {
    echo "TrustBridge API Test Runner"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  basic         Run basic tests (default)"
    echo "  report        Run tests and generate HTML report"
    echo "  exchange      Run Exchange API tests only"
    echo "  transfer      Run Transfer API tests only"
    echo "  load [n]      Run load tests with n iterations (default: 10)"
    echo "  ci            Run in CI/CD mode (JSON output)"
    echo "  help          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL      API base URL (default: http://localhost:3000)"
    echo ""
    echo "Examples:"
    echo "  $0 basic"
    echo "  $0 report"
    echo "  BASE_URL=https://api.trustbridge.io $0 basic"
    echo "  $0 load 20"
    echo ""
}

# Main script
main() {
    echo ""
    echo "════════════════════════════════════════"
    echo "   TrustBridge API Test Runner v1.0"
    echo "════════════════════════════════════════"
    echo ""
    
    # Check prerequisites
    check_newman || exit 1
    
    # Parse command
    COMMAND=${1:-basic}
    
    case "$COMMAND" in
        basic)
            check_server || exit 1
            run_basic_tests
            ;;
        report)
            check_server || exit 1
            run_tests_with_report
            ;;
        exchange)
            check_server || exit 1
            run_folder_tests "Exchange API"
            ;;
        transfer)
            check_server || exit 1
            run_folder_tests "Transfer API"
            ;;
        load)
            check_server || exit 1
            ITERATIONS=${2:-10}
            run_load_tests "${ITERATIONS}"
            ;;
        ci)
            check_server || exit 1
            run_ci_tests
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            show_usage
            exit 1
            ;;
    esac
    
    echo ""
    if [ $? -eq 0 ]; then
        print_success "All tests completed successfully!"
    else
        print_error "Some tests failed. Check the output above."
        exit 1
    fi
}

# Run main function
main "$@"
