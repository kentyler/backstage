/**
 * @file db/invitations/createInvitation.js
 * @description Create a new participant invitation
 */

import crypto from 'crypto';

/**
 * Creates a participant invitation
 * @param {Object} pool - Database connection pool
 * @param {string} invitedBy - ID of participant sending invitation
 * @param {string} email - Email address to invite
 * @param {number} clientId - Client ID for the invitation
 * @param {number} expirationDays - Days until invitation expires (default: 7)
 * @returns {Promise<Object>} Created invitation record
 */
export async function createInvitation(pool, invitedBy, email, clientId, expirationDays = 7) {
  console.log('🔐 INVITATIONS: Creating invitation', { invitedBy, email, clientId });
  
  // Generate secure random token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration date
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
  
  try {
    // Check if invitation already exists for this email/client
    const existingInvite = await pool.query(`
      SELECT id, accepted_at 
      FROM participant_invitations 
      WHERE email = $1 AND client_id = $2 AND accepted_at IS NULL
    `, [email, clientId]);
    
    if (existingInvite.rows.length > 0) {
      throw new Error('An invitation for this email address already exists');
    }
    
    // Check if participant already exists
    const existingParticipant = await pool.query(`
      SELECT id FROM participants WHERE email = $1 AND client_id = $2
    `, [email, clientId]);
    
    if (existingParticipant.rows.length > 0) {
      throw new Error('A participant with this email address already exists');
    }
    
    // Create the invitation
    const result = await pool.query(`
      INSERT INTO participant_invitations 
      (invited_by, email, client_id, invitation_token, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, invitation_token, expires_at, created_at
    `, [invitedBy, email, clientId, invitationToken, expiresAt]);
    
    const invitation = result.rows[0];
    
    console.log('🔐 INVITATIONS: Invitation created successfully', {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expires_at
    });
    
    return invitation;
    
  } catch (error) {
    console.error('🔐 INVITATIONS: Error creating invitation:', error.message);
    throw error;
  }
}