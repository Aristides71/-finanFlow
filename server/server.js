const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const upload = multer({ storage: multer.memoryStorage() });

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(express.json());

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!email || !password || !name) {
       return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        trialStartDate: new Date(),
        subscriptionStatus: 'TRIAL'
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus } });
  } catch (error) {
    if (error.code === 'P2002') { 
       return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    // Check trial status
    if (user.email === 'agomes.bel71@gmail.com') {
        if (user.subscriptionStatus === 'EXPIRED') {
             await prisma.user.update({
               where: { id: user.id },
               data: { subscriptionStatus: 'TRIAL' }
           });
           user.subscriptionStatus = 'TRIAL';
        }
    } else if (user.subscriptionStatus === 'TRIAL') {
       const now = new Date();
       const trialStart = new Date(user.trialStartDate);
       const diffTime = Math.abs(now - trialStart);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
       
       if (diffDays > 3) {
           await prisma.user.update({
               where: { id: user.id },
               data: { subscriptionStatus: 'EXPIRED' }
           });
           user.subscriptionStatus = 'EXPIRED';
       }
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions with optional date filters
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, type, category, minAmount, maxAmount } = req.query;
    const userId = req.user.id;
    
    const where = { userId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (type) where.type = type;
    if (category) where.category = category;

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { description, amount, type, category, date, bankAccountId } = req.body;
    const userId = req.user.id;
    
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        userId,
        bankAccountId: bankAccountId ? parseInt(bankAccountId) : null
      },
    });
    try {
      if (category && category.trim()) {
        await prisma.category.upsert({
          where: { userId_name: { userId, name: category.trim() } },
          update: { updatedAt: new Date() },
          create: { userId, name: category.trim() }
        });
      }
    } catch (_) {}
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify ownership
    const transaction = await prisma.transaction.findUnique({ where: { id: parseInt(id) } });
    if (!transaction || transaction.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Current Month defaults
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { startDate = startOfMonth.toISOString(), endDate = endOfMonth.toISOString() } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    // Category breakdown
    const categories = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));

    res.json({
      summary: { income, expense, balance },
      categoryData,
      transactions: transactions.slice(0, 5), // Recent 5
    });
  } catch (error) {
    console.error('Error in /api/dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email sending endpoint (protected)
app.post('/api/send-report', authenticateToken, upload.single('report'), async (req, res) => {
  try {
    const { email, subject, text } = req.body;
    const file = req.file;

    if (!email || !file) {
      return res.status(400).json({ error: 'Email and report file are required' });
    }

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal_user',
        pass: process.env.EMAIL_PASS || 'ethereal_pass',
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Finance Manager" <no-reply@financemanager.com>',
      to: email,
      subject: subject || 'Relatório Financeiro',
      text: text || 'Segue em anexo o relatório financeiro solicitado.',
      attachments: [
        {
          filename: 'relatorio.pdf',
          content: file.buffer,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    res.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Bank Account Routes
app.get('/api/bank-accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      include: { 
         transactions: true // In future, maybe limit this or just aggregate balance
      }
    });
    
    // Calculate current balance on the fly: initialBalance + income - expense
    const accountsWithBalance = accounts.map(account => {
        const income = account.transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + t.amount, 0);
        const expense = account.transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + t.amount, 0);
        
        return {
            ...account,
            currentBalance: account.initialBalance + income - expense
        };
    });

    res.json(accountsWithBalance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bank-accounts', authenticateToken, async (req, res) => {
  try {
    const { name, type, bankName, initialBalance, color } = req.body;
    const userId = req.user.id;

    const account = await prisma.bankAccount.create({
      data: {
        name,
        type,
        bankName,
        initialBalance: parseFloat(initialBalance || 0),
        color,
        userId
      }
    });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bank-accounts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Verify ownership
        const account = await prisma.bankAccount.findUnique({ where: { id: parseInt(id) } });
        if (!account || account.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        // Check if has transactions (optional: block delete or cascade delete. Prisma defaults to restrict if relation exists without cascade)
        // For simplicity, let's allow delete and it will fail if DB constraint fails, or we can delete transactions first.
        // Let's delete transactions first for user convenience in this MVP
        await prisma.transaction.deleteMany({ where: { bankAccountId: parseInt(id) } });

        await prisma.bankAccount.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Bank account deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, startDate, endDate, items } = req.body;
    const budgetName = (name && String(name).trim()) ? String(name).trim() : `Orçamento ${new Date(startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
    const budget = await prisma.budget.create({
      data: {
        userId,
        name: budgetName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        items: {
          create: (items || []).map(i => ({
            category: i.category,
            allocatedAmount: parseFloat(i.allocatedAmount || 0),
          })),
        },
      },
      include: { items: true },
    });
    try {
      const cats = Array.from(new Set((items || []).map(i => String(i.category || '').trim()).filter(Boolean)));
      await Promise.all(cats.map(cat => prisma.category.upsert({
        where: { userId_name: { userId, name: cat } },
        update: { updatedAt: new Date() },
        create: { userId, name: cat }
      })));
    } catch (_) {}
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/budgets/:id/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!budget || budget.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
    });
    const progress = budget.items.map(item => {
      const spent = transactions
        .filter(t => t.type === 'EXPENSE' && t.category === item.category)
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        itemId: item.id,
        category: item.category,
        allocatedAmount: item.allocatedAmount,
        spent,
        remaining: Math.max(item.allocatedAmount - spent, 0),
        percent: item.allocatedAmount > 0 ? Math.min((spent / item.allocatedAmount) * 100, 100) : 0,
      };
    });
    res.json({ budget: { id: budget.id, name: budget.name, startDate: budget.startDate, endDate: budget.endDate }, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name required' });
    const cat = await prisma.category.upsert({
      where: { userId_name: { userId, name: String(name).trim() } },
      update: { updatedAt: new Date() },
      create: { userId, name: String(name).trim() }
    });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);
    const { name } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name required' });
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return res.status(403).json({ error: 'Not authorized' });
    const updated = await prisma.category.update({
      where: { id },
      data: { name: String(name).trim(), updatedAt: new Date() }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return res.status(403).json({ error: 'Not authorized' });
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
