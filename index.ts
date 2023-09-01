var express = require("express");
import { PrismaClient, Prisma } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const prisma = new PrismaClient();

console.log(process.env.DATABASE_URL);

app.get('/', (req, res) => {
  res.send('Welcome to the REST API!');
});

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Database connection successful.');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();

app.use(express.json());

// Create a new user with email uniqueness validation
app.post('/users', async (req, res) => {
  try {
    console.log('Received request to create user:', req.body);

    const newUser = await prisma.user.create({
      data: {
        email: req.body.email,
        name: req.body.name,
      },
    });

    console.log('User created:', newUser);

    res.json(newUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({ error: 'Validation error. Please check your data.' });
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Email is already in use.' });
      } else {
        res.status(500).json({ error: 'An error occurred while creating the user.' });
      }
    } else {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'An error occurred while creating the user.' });
    }
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
});

// Get user by ID
app.get('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
    } else {
      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the user.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
