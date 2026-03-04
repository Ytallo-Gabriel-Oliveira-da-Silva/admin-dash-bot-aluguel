const jwt = require('jsonwebtoken');

function authAdmin(req, res, next) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const cookieToken = req.cookies?.admin_token;
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = { authAdmin };
