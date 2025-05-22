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
  handleDeleteFile
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
          topicMessages.map((msg, index) => (
            <MessageItem
              key={msg.id || index}
              message={msg}
              index={index}
              selectedMessageId={selectedMessageId}
              setSelectedMessageId={setSelectedMessageId}
              expandedMessages={expandedMessages}
              deletingFileId={deletingFileId}
              handleDeleteFile={handleDeleteFile}
            />
          ))
        )}
        <div ref={messagesEndRef} style={{ height: '1px', clear: 'both' }} />
      </div>
    </div>
  );
};

export default MessageList;
