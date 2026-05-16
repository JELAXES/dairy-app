require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// ===== MONGODB =====

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected ✅");
})
.catch((err) => {
    console.log(err);
});

// ===== SCHEMA =====

const EntrySchema = new mongoose.Schema({

    type:String,

    month:String,

    date:String,

    cows:Number,

    milkPrice:Number,

    salary:Number,

    monthlyExpense:Number,

    dailyMilk:Number,

    milkAM:Number,

    milkPM:Number,

    discardedMilk:Number,

    feedData:Object
});

const Entry =
    mongoose.model(
        "Entry",
        EntrySchema
    );

// ===== ADD ENTRY =====

app.post("/add", async (req,res)=>{

    try{

        // REPLACE SAME DAY MILK ENTRY

        if(req.body.type === "milk"){

            await Entry.deleteMany({

                type:"milk",

                date:req.body.date
            });
        }

        // REPLACE SAME MONTH SETTINGS

        if(req.body.type === "monthly"){

            await Entry.deleteMany({

                type:"monthly",

                month:req.body.month
            });
        }

        await Entry.create(req.body);

        res.send({
            success:true
        });

    }catch(err){

        console.log(err);

        res.status(500).send({
            success:false
        });
    }
});

// ===== DASHBOARD =====

app.get("/dashboard", async (req,res)=>{

    try{

        const selectedMonth =
            req.query.month;

        const data =
            await Entry.find().sort({_id:1});

        // MONTH SETTINGS

        const monthlyEntries =
            data.filter(d =>

                d.type === "monthly" &&

                (
                    !selectedMonth ||

                    d.month === selectedMonth
                )
            );

        // MILK ENTRIES

        const milkEntries =
            data.filter(d =>

                d.type === "milk" &&

                (
                    !selectedMonth ||

                    d.date?.startsWith(
                        selectedMonth
                    )
                )
            );

        // LATEST MONTH SETTINGS

        const latestMonthly =
            monthlyEntries[
                monthlyEntries.length - 1
            ];

        // EXPENSE

        const totalExpense =
            Number(
                latestMonthly?.monthlyExpense || 0
            );

        // MILK TOTALS

        let totalMilk = 0;

        let totalAMMilk = 0;

        let totalPMMilk = 0;

        let totalDiscardedMilk = 0;

        milkEntries.forEach(entry => {

            totalMilk +=
                Number(
                    entry.dailyMilk || 0
                );

            totalAMMilk +=
                Number(
                    entry.milkAM || 0
                );

            totalPMMilk +=
                Number(
                    entry.milkPM || 0
                );

            totalDiscardedMilk +=
                Number(
                    entry.discardedMilk || 0
                );
        });

        // MILK PRICE

        const milkPrice =
            Number(
                latestMonthly?.milkPrice || 0
            );

        // REVENUE

        const totalRevenue =
            totalMilk *
            milkPrice;

        // PROFIT

        const totalProfit =
            totalRevenue -
            totalExpense;

        // SEND DATA

        res.send({

            totalExpense,

            totalMilk,

            totalAMMilk,

            totalPMMilk,

            totalDiscardedMilk,

            totalRevenue,

            totalProfit,

            milkPrice,

            monthlySettings:
                latestMonthly || {},

            records:milkEntries
        });

    }catch(err){

        console.log(err);

        res.status(500).send({
            success:false
        });
    }
});

// ===== START SERVER =====

app.listen(3000,"0.0.0.0",()=>{

    console.log(
        "Server running on port 3000"
    );
});