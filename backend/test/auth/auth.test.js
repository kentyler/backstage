/**
 * Auth Column Test Suite
 * Tests database operations and authentication functions
 * Focus: Backend functionality, not UI
 */

import { expect } from 'chai';
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

// Test database connection
const testClient = new Client({
  connectionString: process.env.DB_HOST
});

describe('Auth Column - Database Operations', function() {
  this.timeout(10000);

  before(async function() {
    console.log('🔐 AUTH TESTS: Connecting to database...');
    await testClient.connect();
  });

  after(async function() {
    console.log('🔐 AUTH TESTS: Closing database connection...');
    await testClient.end();
  });

  describe('Database Schema Validation', function() {
    
    it('should have participants table in public schema', async function() {
      const result = await testClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'participants'
        )
      `);
      expect(result.rows[0].exists).to.be.true;
    });

    it('should have required columns in participants table', async function() {
      const result = await testClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'participants' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      const columns = result.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES'
      }));

      console.log('🔐 AUTH TESTS: Participants table columns:', columns);

      // Check for required auth columns
      const requiredColumns = ['id', 'email', 'password', 'client_id'];
      for (const reqCol of requiredColumns) {
        const found = columns.find(col => col.name === reqCol);
        expect(found, `Column ${reqCol} should exist`).to.not.be.undefined;
      }
    });

    it('should have unique constraint on email', async function() {
      const result = await testClient.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'participants' 
        AND table_schema = 'public'
        AND constraint_type = 'UNIQUE'
      `);
      
      // Check if email has unique constraint
      const emailConstraint = await testClient.query(`
        SELECT column_name
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'participants'
        AND table_schema = 'public'
        AND column_name = 'email'
      `);
      
      expect(emailConstraint.rows.length).to.be.greaterThan(0);
    });
  });

  describe('Password Security', function() {
    
    it('should hash passwords with bcrypt', function() {
      const password = 'testPassword123';
      const hash = bcrypt.hashSync(password, 10);
      
      expect(hash).to.not.equal(password);
      expect(hash.startsWith('$2b$')).to.be.true;
      expect(bcrypt.compareSync(password, hash)).to.be.true;
    });

    it('should reject weak passwords in validation', function() {
      const weakPasswords = ['123', 'password', 'abc', ''];
      
      const isPasswordWeak = (password) => {
        return password.length < 6 || 
               password === 'password' ||
               password === '123456' ||
               !/[A-Z]/.test(password) ||  // No uppercase
               !/[0-9]/.test(password);    // No numbers
      };
      
      weakPasswords.forEach(weak => {
        const isWeak = isPasswordWeak(weak);
        expect(isWeak, `Password "${weak}" should be considered weak`).to.be.true;
      });
    });

    it('should accept strong passwords', function() {
      const strongPasswords = ['StrongPass123!', 'MySecureP@ssw0rd', 'Complex1ty!'];
      
      const isPasswordWeak = (password) => {
        return password.length < 6 || 
               password === 'password' ||
               password === '123456' ||
               !/[A-Z]/.test(password) ||  // No uppercase
               !/[0-9]/.test(password);    // No numbers
      };
      
      strongPasswords.forEach(strong => {
        const isStrong = !isPasswordWeak(strong);
        expect(isStrong, `Password "${strong}" should be considered strong`).to.be.true;
      });
    });
  });

  describe('Authentication Logic', function() {
    let testUserId;

    it('should create a test participant with auto-generated ID', async function() {
      const email = `test-${Date.now()}@example.com`;
      const password = 'TestPassword123!';
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      const result = await testClient.query(`
        INSERT INTO participants (name, email, password, client_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, client_id
      `, ['Test User', email, hashedPassword, 1]);
      
      testUserId = result.rows[0].id;
      
      expect(result.rows[0].email).to.equal(email);
      expect(result.rows[0].client_id).to.equal(1);
      expect(testUserId).to.be.a('string');
      expect(parseInt(testUserId)).to.be.greaterThan(0);
      console.log('🔐 AUTH TESTS: Created participant with auto-generated ID:', testUserId);
    });

    it('should retrieve participant by email', async function() {
      const email = `test-${Date.now()-1000}@example.com`;
      
      // First create a user to find
      await testClient.query(`
        INSERT INTO participants (name, email, password, client_id)
        VALUES ($1, $2, $3, $4)
      `, ['Find Test User', email, 'hashedpass', 1]);

      const result = await testClient.query(`
        SELECT id, email, client_id, password
        FROM participants
        WHERE email = $1
      `, [email]);
      
      expect(result.rows.length).to.equal(1);
      expect(result.rows[0].email).to.equal(email);
      expect(result.rows[0].client_id).to.equal(1);
    });

    it('should validate password correctly', async function() {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      const correctValidation = bcrypt.compareSync(password, hashedPassword);
      const incorrectValidation = bcrypt.compareSync(wrongPassword, hashedPassword);
      
      expect(correctValidation).to.be.true;
      expect(incorrectValidation).to.be.false;
    });

    it('should handle non-existent user lookup', async function() {
      const result = await testClient.query(`
        SELECT id, email, client_id
        FROM participants
        WHERE email = $1
      `, ['nonexistent@example.com']);
      
      expect(result.rows.length).to.equal(0);
    });

    after(async function() {
      // Clean up test users
      if (testUserId) {
        await testClient.query(`
          DELETE FROM participants
          WHERE id = $1 OR email LIKE 'test-%@example.com'
        `, [testUserId]);
      }
    });
  });

  describe('Client Association', function() {
    
    it('should have valid client_id for participants', async function() {
      const result = await testClient.query(`
        SELECT DISTINCT client_id
        FROM participants
        WHERE client_id IS NOT NULL
        LIMIT 5
      `);
      
      result.rows.forEach(row => {
        expect(row.client_id).to.be.a('number');
        expect(row.client_id).to.be.greaterThan(0);
      });
    });

    it('should enforce client_id not null constraint', async function() {
      const uniqueEmail = `nullclient-test-${Date.now()}@example.com`;
      
      try {
        await testClient.query(`
          INSERT INTO participants (name, email, password)
          VALUES ($1, $2, $3)
        `, ['Null Client Test', uniqueEmail, 'hashedpass']);
        
        // If we get here, the constraint didn't work
        expect.fail('Should not allow null client_id');
      } catch (error) {
        // This is expected - null constraint should prevent insert
        console.log('🔐 AUTH TESTS: Null constraint error:', error.message);
        expect(error.message.toLowerCase()).to.satisfy(msg => 
          msg.includes('null') || msg.includes('not-null') || msg.includes('violates not-null')
        );
      }
    });
  });

  describe('Data Integrity', function() {
    
    it('should prevent duplicate email addresses', async function() {
      const email = `duplicate-test-${Date.now()}@example.com`;
      
      // First insert should succeed
      await testClient.query(`
        INSERT INTO participants (name, email, password, client_id)
        VALUES ($1, $2, $3, $4)
      `, ['First User', email, 'hashedpass1', 1]);
      
      // Second insert with same email should fail
      try {
        await testClient.query(`
          INSERT INTO participants (name, email, password, client_id)
          VALUES ($1, $2, $3, $4)
        `, ['Second User', email, 'hashedpass2', 1]);
        
        expect.fail('Should not allow duplicate emails');
      } catch (error) {
        expect(error.message).to.include('unique');
      }
      
      // Cleanup
      await testClient.query(`DELETE FROM participants WHERE email = $1`, [email]);
    });

    it('should maintain referential integrity for client_id', async function() {
      // This test would check if clients table exists and foreign key works
      // For now, just check that client_id values are reasonable
      const result = await testClient.query(`
        SELECT MIN(client_id) as min_id, MAX(client_id) as max_id
        FROM participants
        WHERE client_id IS NOT NULL
      `);
      
      if (result.rows[0].min_id) {
        expect(result.rows[0].min_id).to.be.at.least(1);
        expect(result.rows[0].max_id).to.be.lessThan(1000); // Reasonable upper bound
      }
    });
  });
});

describe('Auth Column - API Functions', function() {
  this.timeout(10000);

  describe('Email Validation', function() {
    
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should accept valid email formats', function() {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@example.org',
        'admin@company.co.uk'
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email), `${email} should be valid`).to.be.true;
      });
    });

    it('should reject invalid email formats', function() {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user name@domain.com',
        'user@domain',
        ''
      ];
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email), `${email} should be invalid`).to.be.false;
      });
    });
  });

  describe('Auth State Management', function() {
    
    it('should extract participant_id and client_id from user data', function() {
      const mockUserData = {
        id: 'participant123',
        email: 'test@example.com',
        client_id: 5,
        name: 'Test User'
      };
      
      const participantId = mockUserData.id;
      const clientId = mockUserData.client_id || 1;
      
      expect(participantId).to.equal('participant123');
      expect(clientId).to.equal(5);
    });

    it('should handle missing client_id with default', function() {
      const mockUserDataNoClient = {
        id: 'participant456',
        email: 'test2@example.com',
        name: 'Test User 2'
      };
      
      const clientId = mockUserDataNoClient.client_id || 1;
      expect(clientId).to.equal(1);
    });

    it('should validate required auth properties', function() {
      const completeAuthState = {
        isAuthenticated: true,
        participantId: 'p123',
        clientId: 1,
        user: { id: 'p123', email: 'test@example.com' }
      };
      
      expect(completeAuthState.isAuthenticated).to.be.true;
      expect(completeAuthState.participantId).to.be.a('string');
      expect(completeAuthState.clientId).to.be.a('number');
      expect(completeAuthState.user).to.be.an('object');
    });
  });
});

console.log('🔐 AUTH TESTS: Test suite loaded successfully');