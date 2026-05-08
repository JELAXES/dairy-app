require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// ===== MONGODB CONNECTION =====

mongoose.connect(
    process.env.MONGO_URI
)
.then(() => {
    console.log("MongoDB Connected ✅");
})
.catch((err) => {
    console.log(err);
});

// ===== SCHEMA =====

const EntrySchema = new mongoose.Schema({

    worker: String,
    date: String,

    cows: Number,

    milk: Number,
    milkPrice: Number,

    salary: Number,

    silageCost: Number,
    silageQty: Number,

    feedCost: Number,
    feedQty: Number,

    bhusaCost: Number,
    bhusaQty: Number,

    mineralCost: Number,
    mineralQty: Number,

    yeastCost: Number,
    yeastQty: Number,

    bufferCost: Number,
    bufferQty: Number,

    glycolCost: Number,
    glycolQty: Number,

    sodaCost: Number,
    sodaQty: Number,

    dcpCost: Number,
    dcpQty: Number,

    totalExpense: Number,
    revenue: Number,
    profit: Number,

    costPerCow: Number,
    costPerLiter: Number
});

// ===== MODEL =====

const Entry = mongoose.model(
    "Entry",
    EntrySchema
);

// ===== ADD ENTRY =====

app.post("/add", async (req, res) => {

    try {

        const data = req.body;

        await Entry.create(data);

        res.send({
            success: true,
            message: "Entry Saved"
        });

    } catch (err) {

        console.log(err);

        res.status(500).send({
            success: false,
            message: "Error Saving Entry"
        });
    }
});

// ===== DASHBOARD =====

app.get("/dashboard", async (req, res) => {

    try {

        const data =
            await Entry.find().sort({_id:-1});

        let totalExpense = 0;
        let totalRevenue = 0;
        let totalMilk = 0;
        let totalProfit = 0;

        data.forEach((d) => {

            totalExpense +=
                d.totalExpense || 0;

            totalRevenue +=
                d.revenue || 0;

            totalMilk +=
                d.milk || 0;

            totalProfit +=
                d.profit || 0;
        });

        res.send({

            totalExpense,
            totalRevenue,
            totalMilk,
            totalProfit,

            records: data
        });

    } catch (err) {

        console.log(err);

        res.status(500).send({
            success: false,
            message: "Dashboard Error"
        });
    }
});

// ===== SERVER =====

app.listen(3000, "0.0.0.0", () => {

    console.log(
        "Server running on http://localhost:3000"
    );
});