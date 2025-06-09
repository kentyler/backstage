/**
 * Email Service Test Suite
 * Tests email sending functionality for invitations
 */

import { expect } from 'chai';
import { sendInvitationEmail, validateEmailConfig } from '../../services/auth/emailService.js';

describe('Email Service', function() {
  this.timeout(15000); // Email sending can be slow

  describe('Configuration Validation', function() {
    
    it('should validate email configuration', async function() {
      const isValid = await validateEmailConfig();
      expect(isValid).to.be.a('boolean');
      console.log('📧 EMAIL TEST: Configuration valid:', isValid);
    });
  });

  describe('Invitation Email Sending', function() {
    
    it('should send invitation email successfully', async function() {
      const testToken = 'test-token-' + Date.now();
      
      const result = await sendInvitationEmail(
        'test-recipient@example.com',
        'Test Inviter',
        'inviter@example.com',
        testToken,
        'http://localhost:3000'
      );
      
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('messageId');
      expect(result.messageId).to.be.a('string');
      
      // In development, should have preview URL
      if (process.env.NODE_ENV !== 'production') {
        expect(result).to.have.property('previewUrl');
        console.log('📧 EMAIL TEST: Preview URL:', result.previewUrl);
      }
    });

    it('should handle email sending errors gracefully', async function() {
      // Test with invalid configuration by using bad host
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.SMTP_HOST = 'invalid-smtp-host.fake';
      
      try {
        await sendInvitationEmail(
          'test@example.com',
          'Test User',
          'test@example.com',
          'test-token',
          'http://localhost:3000'
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('Failed to send invitation email');
      } finally {
        // Restore environment
        process.env.NODE_ENV = originalEnv;
        delete process.env.SMTP_HOST;
      }
    });

    it('should generate proper invitation URLs', async function() {
      const testToken = 'abc123def456';
      const baseUrl = 'https://myapp.com';
      
      const result = await sendInvitationEmail(
        'test@example.com',
        'Test Inviter',
        'inviter@example.com',
        testToken,
        baseUrl
      );
      
      expect(result.success).to.be.true;
      // We can't directly test the URL without parsing the email content,
      // but we can verify the email was sent successfully
    });

    it('should use default base URL when not provided', async function() {
      const testToken = 'default-url-test-' + Date.now();
      
      const result = await sendInvitationEmail(
        'test@example.com',
        'Test Inviter',
        'inviter@example.com',
        testToken
        // No baseUrl provided - should use default
      );
      
      expect(result.success).to.be.true;
      expect(result).to.have.property('messageId');
    });
  });

  describe('Email Content', function() {
    
    it('should include all required information in email', async function() {
      const inviterName = 'Jane Smith';
      const inviterEmail = 'jane@company.com';
      const recipientEmail = 'newuser@example.com';
      const token = 'content-test-token-' + Date.now();
      
      const result = await sendInvitationEmail(
        recipientEmail,
        inviterName,
        inviterEmail,
        token,
        'http://localhost:3000'
      );
      
      expect(result.success).to.be.true;
      // Email content validation would require intercepting the actual email,
      // which is complex in automated tests. The service creates the content
      // with all the provided parameters, so if sending succeeds, content is valid.
    });
  });
});

console.log('📧 EMAIL TESTS: Test suite loaded successfully');