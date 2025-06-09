/**
 * @file db/invitations/getInvitationByToken.js
 * @description Retrieve invitation by token for acceptance
 */

/**
 * Gets an invitation by its token
 * @param {Object} pool - Database connection pool
 * @param {string} token - Invitation token
 * @returns {Promise<Object|null>} Invitation record or null if not found/expired
 */
export async function getInvitationByToken(pool, token) {
  console.log('🔐 INVITATIONS: Looking up invitation by token');
  
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.invited_by,
        i.email,
        i.client_id,
        i.invitation_token,
        i.expires_at,
        i.accepted_at,
        i.created_at,
        p.name as invited_by_name,
        p.email as invited_by_email
      FROM participant_invitations i
      JOIN participants p ON i.invited_by = p.id
      WHERE i.invitation_token = $1
    `, [token]);
    
    if (result.rows.length === 0) {
      console.log('🔐 INVITATIONS: No invitation found for token');
      return null;
    }
    
    const invitation = result.rows[0];
    
    // Check if already accepted
    if (invitation.accepted_at) {
      console.log('🔐 INVITATIONS: Invitation already accepted');
      return null;
    }
    
    // Check if expired
    if (new Date() > new Date(invitation.expires_at)) {
      console.log('🔐 INVITATIONS: Invitation expired');
      return null;
    }
    
    console.log('🔐 INVITATIONS: Valid invitation found', {
      id: invitation.id,
      email: invitation.email,
      invitedBy: invitation.invited_by_name
    });
    
    return invitation;
    
  } catch (error) {
    console.error('🔐 INVITATIONS: Error getting invitation:', error.message);
    throw error;
  }
}