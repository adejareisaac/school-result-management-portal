// test-services.js – Sanity check for services
const AuthService = require('./services/authService');
const StudentService = require('./services/studentService');
const ResultService = require('./services/resultService');

(async () => {
    try {
        console.log('🔍 Testing AuthService...');
        // Note: We can't test login without a valid password, but we'll just check if the module loads
        console.log('✅ AuthService loaded.');

        console.log('🔍 Testing StudentService...');
        // Generate an ID
        const id = await StudentService.generateStudentId('2025/2026');
        console.log(`   Generated ID: ${id}`);
        
        // Search
        const students = await StudentService.searchStudents();
        console.log(`   Found ${students.length} students.`);

        console.log('🔍 Testing ResultService...');
        if (students.length > 0) {
            const data = await ResultService.getStudentResults(students[0].student_id, '2025/2026', 'First');
            console.log(`   ${data.student.name} has ${data.results.length} results.`);
        }

        console.log('✅ All services loaded successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
})();
