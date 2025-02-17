import { CompressionOptions } from 'compression';

export const compressionConfig: CompressionOptions = {
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return true;
  },
  level: 6,
  threshold: 1024,
  memLevel: 8,
  strategy: 0,
  contentType: [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    'application/x-yaml',
    'text/yaml',
  ],
};
