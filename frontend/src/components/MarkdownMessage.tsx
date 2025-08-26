import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Typography } from 'antd';
import './MarkdownMessage.css';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className }) => {
  return (
    <div className={`markdown-message ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <SyntaxHighlighter
                  style={tomorrow as any}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: '1em 0',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }
            
            return (
              <code 
                className={`inline-code ${className || ''}`}
                style={{
                  backgroundColor: '#f6f8fa',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '0.9em',
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote
                style={{
                  borderLeft: '4px solid #d0d7de',
                  paddingLeft: '16px',
                  margin: '16px 0',
                  color: '#656d76',
                  fontStyle: 'italic'
                }}
              >
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    border: '1px solid #d0d7de'
                  }}
                >
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d0d7de',
                  backgroundColor: '#f6f8fa',
                  fontWeight: 'bold',
                  textAlign: 'left'
                }}
              >
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d0d7de'
                }}
              >
                {children}
              </td>
            );
          },
          h1({ children }) {
            return (
              <Typography.Title level={1} style={{ marginTop: '24px', marginBottom: '16px' }}>
                {children}
              </Typography.Title>
            );
          },
          h2({ children }) {
            return (
              <Typography.Title level={2} style={{ marginTop: '24px', marginBottom: '16px' }}>
                {children}
              </Typography.Title>
            );
          },
          h3({ children }) {
            return (
              <Typography.Title level={3} style={{ marginTop: '24px', marginBottom: '16px' }}>
                {children}
              </Typography.Title>
            );
          },
          h4({ children }) {
            return (
              <Typography.Title level={4} style={{ marginTop: '24px', marginBottom: '16px' }}>
                {children}
              </Typography.Title>
            );
          },
          h5({ children }) {
            return (
              <Typography.Title level={5} style={{ marginTop: '24px', marginBottom: '16px' }}>
                {children}
              </Typography.Title>
            );
          },
          p({ children }) {
            return (
              <Typography.Paragraph style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                {children}
              </Typography.Paragraph>
            );
          },
          ul({ children }) {
            return (
              <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>
                {children}
              </ol>
            );
          },
          li({ children }) {
            return (
              <li style={{ marginBottom: '4px', lineHeight: '1.6' }}>
                {children}
              </li>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
