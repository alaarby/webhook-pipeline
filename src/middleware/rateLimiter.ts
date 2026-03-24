import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs:         60 * 1000, 
  max:              100,        
  standardHeaders:  true,       
  legacyHeaders:    false,
  message: { error: 'Too many requests, please try again later' },
});

export const webhookLimiter = rateLimit({
  windowMs:         60 * 1000, 
  max:              30,         
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { error: 'Webhook rate limit exceeded' },
});