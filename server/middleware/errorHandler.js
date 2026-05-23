const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`[Error] ${err.message}`);
  res.status(status).json({ message: err.message || 'Internal Server Error' });
};

export default errorHandler;
