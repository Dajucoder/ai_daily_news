import React, { useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, BulbOutlined } from '@ant-design/icons';
import MarkdownMessage from './MarkdownMessage';

const { Text } = Typography;

interface ThinkingProcessProps {
  thinking: string;
  style?: React.CSSProperties;
}

const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ thinking, style }) => {
  const [expanded, setExpanded] = useState(false);

  if (!thinking || thinking.trim().length === 0) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{
        marginBottom: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        ...style
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: expanded ? '12px' : '0' }}>
        <BulbOutlined style={{ color: '#faad14', marginRight: '8px' }} />
        <Text type="secondary" style={{ flex: 1, fontSize: '13px' }}>
          思考过程
        </Text>
        <Button
          type="text"
          size="small"
          icon={expanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setExpanded(!expanded)}
          style={{ padding: '2px 6px', height: 'auto' }}
        >
          {expanded ? '隐藏' : '查看'}
        </Button>
      </div>
      
      {expanded && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '13px',
            lineHeight: '1.5',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          <MarkdownMessage content={thinking} />
        </div>
      )}
    </Card>
  );
};

export default ThinkingProcess;
