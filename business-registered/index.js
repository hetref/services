import express from "express";
import cors from "cors";
import { Kafka } from "kafkajs";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

const kafka = new Kafka({
  clientId: "business-registered",
  brokers: ["localhost:9094"],
});

const producer = kafka.producer();

const connectToKafka = async () => {
  try {
    await producer.connect();
    console.log("Producer connected!");
  } catch (err) {
    console.log("Error connecting to Kafka", err);
  }
};

app.post("/business-registered", async (req, res) => {
  try {
    const { businessName, email, phone, address, businessType } = req.body;
    
    // Validate required fields
    if (!businessName || !email || !phone || !address || !businessType) {
      return res.status(400).json({ 
        error: "Missing required fields: businessName, email, phone, address, businessType" 
      });
    }

    // Generate a unique business ID
    const businessId = `BIZ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const businessData = {
      businessId,
      businessName,
      email,
      phone,
      address,
      businessType,
      registrationDate: new Date().toISOString(),
    };

    // Send event to Kafka
    await producer.send({
      topic: "business-registered",
      messages: [{ 
        value: JSON.stringify(businessData),
        key: businessId
      }],
    });

    console.log(`Business registration event sent: ${businessId}`);
    
    res.status(200).json({ 
      message: "Business registration successful", 
      businessId,
    });
  } catch (error) {
    console.error("Error in business registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

app.listen(8000, () => {
  connectToKafka();
  console.log("Payment service is running on port 8000");
});