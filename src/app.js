require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { registerRoutes } = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const basePath = (process.env.BASE_PATH || '').trim().replace(/\/$/, '');

app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

app.use((req, res, next) => {
  res.locals.basePath = basePath;

  const originalRedirect = res.redirect.bind(res);
  res.redirect = (url) => {
    if (
      typeof url === 'string' &&
      basePath &&
      url.startsWith('/') &&
      !url.startsWith(`${basePath}/`) &&
      url !== basePath
    ) {
      return originalRedirect(`${basePath}${url}`);
    }

    return originalRedirect(url);
  };

  return next();
});

registerRoutes(app);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
