function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err?.response?.status === 429) {
    return res.status(429).json({ message: 'The AI provider is rate limiting requests. Please wait a moment and try again.' });
  }

  if (err?.response?.status === 401 || err?.response?.status === 403) {
    return res.status(401).json({ message: 'The AI provider rejected the backend key or endpoint configuration.' });
  }

  if (err?.response?.status === 404) {
    return res.status(404).json({ message: 'The configured AI provider endpoint could not be found.' });
  }

  if (err?.response?.status >= 500) {
    return res.status(502).json({ message: 'The AI provider failed while generating or evaluating the verification result.' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already taken.` });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(' ') });
  }

  res.status(err.status || 500).json({ message: err.message || 'Something went wrong on the server.' });
}

module.exports = { notFound, errorHandler };
