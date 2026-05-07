require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// DEBUG
console.log(process.env.MONGO_URI);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {

    console.log("MongoDB Connected");

})
.catch((err) => {

    console.log(err);

});

// Schema
const EntrySchema = new mongoose.Schema({

    worker: String,
    date: String,

    silageCost: Number,
    feedCost: Number,
    bhusaCost: Number,
    salary: Number,

    milk: Number,
    pricePerLiter: Number,

    totalExpense: Number,
    revenue: Number
});

// Model
const Entry = mongoose.model(
    "Entry",
    EntrySchema
);

// Add Entry
app.post("/add", async (req, res) => {

    try {

        const newEntry = new Entry(req.body);

        await newEntry.save();

        res.send({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).send({
            success: false
        });
    }
});

// Dashboard
app.get("/dashboard", async (req, res) => {

    try {

        const data = await Entry.find();

        let totalExpense = 0;
        let totalMilk = 0;
        let totalRevenue = 0;

        data.forEach(d => {

            totalExpense += d.totalExpense || 0;

            totalMilk += d.milk || 0;

            totalRevenue += d.revenue || 0;
        });

        const profit =
            totalRevenue -
            totalExpense;

        res.send({

            totalExpense,
            totalMilk,
            totalRevenue,
            profit,

            records: data
        });

    } catch (err) {

        console.log(err);

        res.status(500).send({
            success: false
        });
    }
});

// Start Server
app.listen(3000, "0.0.0.0", () => {

    console.log(
        "Server running on port 3000"
    );
});