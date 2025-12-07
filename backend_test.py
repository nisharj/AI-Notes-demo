import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class NoteGeniusAPITester:
    def __init__(self, base_url="https://notegenius-46.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} - {name}"
        if details:
            result += f" | {details}"
        
        print(result)
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" | Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        signup_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        response = self.run_test("User Signup", "POST", "auth/signup", 200, signup_data)
        if response:
            self.token = response.get('token')
            self.user_id = response.get('user', {}).get('id')
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Try to login with the same credentials used in signup
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if response:
            self.token = response.get('token')
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200) is not None

    def test_folders(self):
        """Test get folders"""
        return self.run_test("Get Folders", "GET", "folders", 200) is not None

    def test_create_note(self):
        """Test note creation"""
        note_data = {
            "title": "Test Note",
            "content": "This is a test note content for API testing. It contains some meaningful text to test AI summary generation.",
            "folder": "Personal",
            "tags": ["test", "api"],
            "scheduled_reminder": (datetime.now() + timedelta(hours=6)).isoformat()
        }
        
        response = self.run_test("Create Note", "POST", "notes", 200, note_data)
        if response:
            self.note_id = response.get('id')
            # Check if AI summary was generated
            if response.get('summary'):
                self.log_test("AI Summary Generation", True, f"Summary: {response['summary'][:50]}...")
            else:
                self.log_test("AI Summary Generation", False, "No summary generated")
            return True
        return False

    def test_get_notes(self):
        """Test get notes"""
        return self.run_test("Get Notes", "GET", "notes", 200) is not None

    def test_get_notes_with_filter(self):
        """Test get notes with folder filter"""
        return self.run_test("Get Notes (Filtered)", "GET", "notes?folder=Personal", 200) is not None

    def test_get_notes_with_search(self):
        """Test get notes with search"""
        return self.run_test("Get Notes (Search)", "GET", "notes?search=test", 200) is not None

    def test_update_note(self):
        """Test note update"""
        if not hasattr(self, 'note_id'):
            self.log_test("Update Note", False, "No note ID available")
            return False
            
        update_data = {
            "title": "Updated Test Note",
            "content": "This is updated content for testing the update functionality.",
            "tags": ["updated", "test"]
        }
        
        return self.run_test("Update Note", "PUT", f"notes/{self.note_id}", 200, update_data) is not None

    def test_regenerate_summary(self):
        """Test regenerate summary"""
        if not hasattr(self, 'note_id'):
            self.log_test("Regenerate Summary", False, "No note ID available")
            return False
            
        response = self.run_test("Regenerate Summary", "POST", f"notes/{self.note_id}/summarize", 200)
        if response and response.get('summary'):
            self.log_test("AI Summary Regeneration", True, f"New summary: {response['summary'][:50]}...")
            return True
        return False

    def test_ask_ai(self):
        """Test Ask AI functionality"""
        ai_data = {
            "question": "What are some good note-taking strategies?",
            "context": "I have notes about work and personal projects"
        }
        
        response = self.run_test("Ask AI", "POST", "ai/ask", 200, ai_data)
        if response and response.get('response'):
            self.log_test("AI Response Generation", True, f"Response: {response['response'][:50]}...")
            return True
        return False

    def test_semantic_search(self):
        """Test semantic search"""
        search_data = {
            "query": "test note content"
        }
        
        return self.run_test("Semantic Search", "POST", "ai/search", 200, search_data) is not None

    def test_delete_note(self):
        """Test note deletion"""
        if not hasattr(self, 'note_id'):
            self.log_test("Delete Note", False, "No note ID available")
            return False
            
        return self.run_test("Delete Note", "DELETE", f"notes/{self.note_id}", 200) is not None

    def test_invalid_auth(self):
        """Test invalid authentication"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token"
        
        success = self.run_test("Invalid Auth Test", "GET", "auth/me", 401) is None
        
        # Restore token
        self.token = original_token
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting NoteGenius API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Health check first
        if not self.test_health_check():
            print("❌ Health check failed - API may be down")
            return False

        # Authentication tests
        if not self.test_signup():
            print("❌ Signup failed - stopping tests")
            return False

        self.test_get_me()
        self.test_invalid_auth()

        # Core functionality tests
        self.test_folders()
        
        # Note operations
        if self.test_create_note():
            self.test_get_notes()
            self.test_get_notes_with_filter()
            self.test_get_notes_with_search()
            self.test_update_note()
            self.test_regenerate_summary()
            
            # AI features
            self.test_ask_ai()
            self.test_semantic_search()
            
            # Cleanup
            self.test_delete_note()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = NoteGeniusAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': tester.tests_passed / tester.tests_run if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())