/**
 * @file routes/api/auth/invite.js
 * @description Participant invitation endpoints
 */

import { createInvitation, getInvitationByToken, acceptInvitation } from '../../../db/auth/invitations/index.js';
import { sendInvitationEmail } from '../../../services/auth/emailService.js';

/**
 * POST /api/auth/invite
 * Create a new participant invitation
 */
export async function inviteParticipant(req, res) {
  const { email } = req.body;
  const { pool, participant_id, client_id } = req;
  
  console.log('🔐 AUTH API: Creating invitation', { participant_id, email, client_id });
  
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    if (!participant_id || !client_id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Get inviter details for email
    const inviterResult = await pool.query(
      'SELECT name, email FROM participants WHERE id = $1',
      [participant_id]
    );
    
    if (inviterResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid participant' });
    }
    
    const inviter = inviterResult.rows[0];
    const invitation = await createInvitation(pool, participant_id, email, client_id);
    
    // Send invitation email
    try {
      const emailResult = await sendInvitationEmail(
        email,
        inviter.name,
        inviter.email,
        invitation.invitation_token,
        req.get('origin') || 'http://localhost:3000'
      );
      
      res.json({
        success: true,
        message: 'Invitation created and email sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expires_at: invitation.expires_at
        },
        email: {
          sent: true,
          messageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl
        }
      });
      
    } catch (emailError) {
      console.error('🔐 AUTH API: Email sending failed:', emailError.message);
      
      // Invitation was created but email failed
      res.json({
        success: true,
        message: 'Invitation created but email sending failed',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expires_at: invitation.expires_at
        },
        email: {
          sent: false,
          error: emailError.message
        }
      });
    }
    
  } catch (error) {
    console.error('🔐 AUTH API: Error creating invitation:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/auth/invite/:token
 * Retrieve invitation by token
 */
export async function getInvitation(req, res) {
  const { token } = req.params;
  const { pool } = req;
  
  console.log('🔐 AUTH API: Getting invitation by token');
  
  try {
    const invitation = await getInvitationByToken(pool, token);
    
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found or expired' });
    }
    
    res.json({
      success: true,
      invitation: {
        email: invitation.email,
        invited_by_name: invitation.invited_by_name,
        invited_by_email: invitation.invited_by_email,
        expires_at: invitation.expires_at
      }
    });
    
  } catch (error) {
    console.error('🔐 AUTH API: Error getting invitation:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * POST /api/auth/invite/:token/accept
 * Accept invitation and create participant
 */
export async function acceptInvitationEndpoint(req, res) {
  const { token } = req.params;
  const { name, password } = req.body;
  const { pool } = req;
  
  console.log('🔐 AUTH API: Accepting invitation');
  
  try {
    if (!name || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and password are required' 
      });
    }
    
    const participant = await acceptInvitation(pool, token, name, password);
    
    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        client_id: participant.client_id
      }
    });
    
  } catch (error) {
    console.error('🔐 AUTH API: Error accepting invitation:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
}