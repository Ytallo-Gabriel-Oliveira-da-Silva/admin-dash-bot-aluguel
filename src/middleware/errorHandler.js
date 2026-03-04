function notFound(req, res) {
  return res.status(404).render('shared/error', {
    title: 'Página não encontrada',
    message: 'O recurso solicitado não foi encontrado.'
  });
}

function errorHandler(error, req, res, next) {
  console.error('[ERROR]', error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor.';

  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
    return res.status(statusCode).json({ error: message });
  }

  return res.status(statusCode).render('shared/error', {
    title: 'Erro',
    message
  });
}

module.exports = { notFound, errorHandler };
