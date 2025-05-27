import React from 'react';
import MessageItem from './MessageItem';

const MessageList = ({
  topicMessages,
  messageContainerRef,
  messagesEndRef,
  selectedMessageId,
  setSelectedMessageId,
  expandedMessages,
  deletingFileId,
  handleDeleteFile,
  activeCommentIndex,
  setActiveCommentIndex,
  handleSubmitComment
}) => {
  return (
    <div className="messages-column">
      <div className="messages-header">
        Messages
      </div>
      <div className="messages-list" ref={messageContainerRef}>
        {topicMessages.length === 0 ? (
          <div className="no-messages">No messages to display</div>
        ) : (
          // Simple sorting by turn_index to ensure correct ordering
          [...topicMessages]
            .sort((a, b) => {
              // Both have turn_index - compare directly
              if (a.turn_index !== undefined && b.turn_index !== undefined) {
                return a.turn_index - b.turn_index;
              }
              // Fall back to array order if turn_index not available
              return 0;
            })
            .map((msg, index) => (
            <MessageItem
              key={msg.id || index}
              message={msg}
              index={index}
              selectedMessageId={selectedMessageId}
              setSelectedMessageId={setSelectedMessageId}
              expandedMessages={expandedMessages}
              deletingFileId={deletingFileId}
              handleDeleteFile={handleDeleteFile}
              activeCommentIndex={activeCommentIndex}
              setActiveCommentIndex={setActiveCommentIndex}
              handleSubmitComment={handleSubmitComment}
            />
          ))
        )}
        <div ref={messagesEndRef} style={{ height: '1px', clear: 'both' }} />
      </div>
    </div>
  );
};

export default MessageList;
