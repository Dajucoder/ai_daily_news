import React, { useState, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import MarkdownMessage from './MarkdownMessage';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  onStreamComplete?: () => void;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  content, 
  isStreaming, 
  onStreamComplete 
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStreaming && content) {
      // 模拟打字机效果
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= content.length) {
            clearInterval(timer);
            onStreamComplete?.();
            return content.length;
          }
          return nextIndex;
        });
      }, 20); // 调整速度，数值越小越快

      return () => clearInterval(timer);
    } else {
      // 如果不是流式或者已完成，直接显示全部内容
      setDisplayContent(content);
      setCurrentIndex(content.length);
    }
  }, [content, isStreaming, onStreamComplete]);

  useEffect(() => {
    setDisplayContent(content.slice(0, currentIndex));
  }, [content, currentIndex]);

  return (
    <div style={{ position: 'relative' }}>
      <MarkdownMessage content={displayContent} />
      {isStreaming && currentIndex < content.length && (
        <span 
          style={{
            display: 'inline-block',
            width: '2px',
            height: '20px',
            backgroundColor: '#1890ff',
            marginLeft: '2px',
            animation: 'blink 1s infinite'
          }}
        />
      )}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default StreamingMessage;
