/**
 * @file db/invitations/acceptInvitation.js
 * @description Accept an invitation and create participant account
 */

import bcrypt from 'bcrypt';

/**
 * Accepts an invitation and creates the participant account
 * @param {Object} pool - Database connection pool
 * @param {string} token - Invitation token
 * @param {string} name - Participant's name
 * @param {string} password - Participant's chosen password
 * @returns {Promise<Object>} Created participant record
 */
export async function acceptInvitation(pool, token, name, password) {
  console.log('🔐 INVITATIONS: Accepting invitation', { token: token.substring(0, 8) + '...' });
  
  try {
    // Get the invitation
    const inviteResult = await pool.query(`
      SELECT id, email, client_id, expires_at, accepted_at
      FROM participant_invitations
      WHERE invitation_token = $1
    `, [token]);
    
    if (inviteResult.rows.length === 0) {
      throw new Error('Invalid invitation token');
    }
    
    const invitation = inviteResult.rows[0];
    
    // Validate invitation
    if (invitation.accepted_at) {
      throw new Error('Invitation has already been accepted');
    }
    
    if (new Date() > new Date(invitation.expires_at)) {
      throw new Error('Invitation has expired');
    }
    
    // Check if participant already exists
    const existingParticipant = await pool.query(`
      SELECT id FROM participants 
      WHERE email = $1 AND client_id = $2
    `, [invitation.email, invitation.client_id]);
    
    if (existingParticipant.rows.length > 0) {
      throw new Error('Participant with this email already exists');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the participant
    const participantResult = await pool.query(`
      INSERT INTO participants (name, email, password, client_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, client_id, created_at
    `, [name, invitation.email, hashedPassword, invitation.client_id]);
    
    const participant = participantResult.rows[0];
    
    // Mark invitation as accepted
    await pool.query(`
      UPDATE participant_invitations 
      SET accepted_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [invitation.id]);
    
    console.log('🔐 INVITATIONS: Invitation accepted successfully', {
      participantId: participant.id,
      email: participant.email,
      clientId: participant.client_id
    });
    
    return participant;
    
  } catch (error) {
    console.error('🔐 INVITATIONS: Error accepting invitation:', error.message);
    throw error;
  }
}