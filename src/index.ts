import express, { Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Configuração de CORS - Permitir que o portal-frontend aceda ao Gateway
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Endpoints de Saúde do Gateway
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// ============================================================================
// CONFIGURAÇÃO DE REVERSE PROXY
// O API Gateway actua como intermediário encaminhando pedidos para o serviço certo
// ============================================================================

// 1. Encaminhar tráfego de Identidade/Autenticação para o iam-service (Porta 8080)
app.use('/auth', createProxyMiddleware({ 
  target: process.env.IAM_SERVICE_URL || 'http://localhost:8080', 
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '',
  }
}));

app.use('/users', createProxyMiddleware({ 
  target: process.env.IAM_SERVICE_URL || 'http://localhost:8080', 
  changeOrigin: true 
}));

// 2. Encaminhar tráfego Académico para o academic-service (Porta 8081)
app.use('/academic', createProxyMiddleware({ 
  target: process.env.ACADEMIC_SERVICE_URL || 'http://localhost:8081', 
  changeOrigin: true,
  pathRewrite: {
    '^/academic': '', // Ex: /academic/students -> /students no serviço interno
  }
}));

// 3. Encaminhar tráfego Financeiro para o finance-service (Porta 8082)
app.use('/finance', createProxyMiddleware({ 
  target: process.env.FINANCE_SERVICE_URL || 'http://localhost:8082', 
  changeOrigin: true,
  pathRewrite: {
    '^/finance': '', 
  }
}));

// 4. Encaminhar tráfego Documental para o document-service (Porta 8083)
app.use('/documents', createProxyMiddleware({ 
  target: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:8083', 
  changeOrigin: true,
  pathRewrite: {
    '^/documents': '/documents', 
  }
}));

app.listen(PORT, () => {
  console.log(`[api-gateway] 🚀 Maestro (API Gateway) inicializado e a ouvir na porta ${PORT}`);
  console.log(`  -> IAM Route: /auth e /users`);
  console.log(`  -> Academic Route: /academic/*`);
  console.log(`  -> Finance Route: /finance/*`);
  console.log(`  -> Documents Route: /documents/*`);
});
