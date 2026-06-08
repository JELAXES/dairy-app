require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// ======================
// MIDDLEWARE
// ======================

app.use(express.json());

app.use(express.urlencoded({
    extended:true
}));

app.use(express.static("public"));

// ======================
// MONGODB
// ======================

mongoose.connect(process.env.MONGO_URI)

.then(()=>{

    console.log(
        "MongoDB Connected ✅"
    );

})

.catch((err)=>{

    console.log(err);
});

// ======================
// USER SCHEMA
// ======================

const UserSchema =
new mongoose.Schema({

    username:String,

    password:String,

    role:String,

    approved:Boolean,

    permissions:[String]
});

const User =
mongoose.model(
    "User",
    UserSchema
);

// ======================
// CLIENT SCHEMA
// ======================

const ClientSchema =
new mongoose.Schema({

    name:String,

    pricePerLiter:Number
});

const Client =
mongoose.model(
    "Client",
    ClientSchema
);

// ======================
// ENTRY SCHEMA
// ======================

const EntrySchema =
new mongoose.Schema({

    type:String,

    date:String,

    client:String,

    worker:String,

    itemCode:String,

    milkAM:Number,

    milkPM:Number,

    discardedMilk:Number,

    dailyMilk:Number,

    cows:Number,

calfMilk:Number,

staffMilk:Number
});

const Entry =
mongoose.model(
    "Entry",
    EntrySchema
);

// ======================
// FEED SCHEMA
// ======================

const FeedSchema =
new mongoose.Schema({

    feedName:String,

    dailyKgPerCow:Number,

    costPerKg:Number,

    cows:Number,

    month:String,

    monthlyExpense:Number
});

const Feed =
mongoose.model(
    "Feed",
    FeedSchema
);

// ======================
// REMARK SCHEMA
// ======================

const RemarkSchema =
new mongoose.Schema({

    text:String,

    createdAt:{

        type:Date,

        default:Date.now
    }
});

const Remark =
mongoose.model(
    "Remark",
    RemarkSchema
);

// ======================
// COUNTER SCHEMA
// ======================

const CounterSchema =
new mongoose.Schema({

    name:{ type:String, unique:true },

    value:{ type:Number, default:1 }
});

const Counter =
mongoose.model(
    "Counter",
    CounterSchema
);

// ======================
// CREATE DEFAULT ADMIN
// ======================

async function createAdmin(){

    try{

        const existing =
        await User.findOne({

            username:"Praveen"
        });

        if(!existing){

            await User.create({

                username:"Praveen",

                password:"vishnu123",

                role:"admin",

                approved:true,

                permissions:["all"]
            });

            console.log(
                "Default Admin Created ✅"
            );
        }

    }catch(err){

        console.log(err);
    }
}

createAdmin();

// ======================
// LOGIN
// ======================

app.post("/login", async (req,res)=>{

    try{

        const user =
        await User.findOne({

            username:req.body.username,

            password:req.body.password
        });

        if(!user){

            return res.send({

                success:false,

                message:
                "Invalid credentials"
            });
        }

        if(!user.approved){

            return res.send({

                success:false,

                message:
                "Approval pending"
            });
        }

        res.send({

            success:true,

            user
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

// ======================
// SIGNUP
// ======================

app.post("/signup", async (req,res)=>{

    try{

        const existing =
        await User.findOne({

            username:req.body.username
        });

        if(existing){

            return res.send({

                success:false,

                message:
                "User already exists"
            });
        }

        await User.create({

            username:req.body.username,

            password:req.body.password,

            role:"worker",

            approved:false,

            permissions:[]
        });

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

// ======================
// PENDING USERS
// ======================

app.get("/pending-users", async (req,res)=>{

    try{

        const users =
        await User.find({

            approved:false
        });

        res.send(users);

    }catch(err){

        console.log(err);

        res.send([]);
    }
});

// ======================
// APPROVE USER
// ======================

app.post("/approve-user", async (req,res)=>{

    try{

        await User.findByIdAndUpdate(

            req.body.id,

            {

                approved:true
            }
        );

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

// ======================
// CLIENTS
// ======================

app.post("/create-client", async (req,res)=>{

    try{

        await Client.create({

            name:req.body.name,

            pricePerLiter:
            req.body.pricePerLiter
        });

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

app.get("/clients", async (req,res)=>{

    try{

        const clients =
        await Client.find()
        .sort({_id:-1});

        res.send(clients);

    }catch(err){

        console.log(err);

        res.send([]);
    }
});

app.post("/delete-client", async (req,res)=>{

    try{

        await Client.findByIdAndDelete(
            req.body.id
        );

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

app.post("/edit-client", async (req,res)=>{

    try{

        await Client.findByIdAndUpdate(

            req.body.id,

            {

                name:req.body.name,

                pricePerLiter:
                req.body.pricePerLiter
            }
        );

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

// ======================
// FEEDS
// ======================

app.get("/feeds", async (req,res)=>{

    try{

        const feeds =
        await Feed.find()
        .sort({_id:-1});

        res.send(feeds);

    }catch(err){

        console.log(err);

        res.send([]);
    }
});

app.post("/save-feed", async (req,res)=>{

    try{

        const {
            feedName,
            dailyKgPerCow,
            costPerKg,
            cows,
            month
        } = req.body;

        const [year,m] =
        month.split("-");

        const daysInMonth =
        new Date(year,m,0)
        .getDate();

        const monthlyExpense =

            Number(dailyKgPerCow)

            *

            Number(costPerKg)

            *

            Number(cows)

            *

            daysInMonth;

        await Feed.create({

            feedName,

            dailyKgPerCow,

            costPerKg,

            cows,

            month,

            monthlyExpense
        });

        res.send({
            success:true
        });

    }catch(err){

        console.log(err);

        res.send({
            success:false
        });
    }
});

app.post("/delete-feed", async (req,res)=>{

    try{

        await Feed.findByIdAndDelete(
            req.body.id
        );

        res.send({
            success:true
        });

    }catch(err){

        console.log(err);

        res.send({
            success:false
        });
    }
});

app.post("/edit-feed", async (req,res)=>{

    try{

        const {
            feedName,
            dailyKgPerCow,
            costPerKg,
            cows,
            month,
            id
        } = req.body;

        const [year,m] =
        month.split("-");

        const daysInMonth =
        new Date(year,m,0)
        .getDate();

        const monthlyExpense =

            Number(dailyKgPerCow)

            *

            Number(costPerKg)

            *

            Number(cows)

            *

            daysInMonth;

        await Feed.findByIdAndUpdate(

            id,

            {

                feedName,

                dailyKgPerCow,

                costPerKg,

                cows,

                month,

                monthlyExpense
            }
        );

        res.send({
            success:true
        });

    }catch(err){

        console.log(err);

        res.send({
            success:false
        });
    }
});
// ======================
// MILK ENTRIES
// ======================

app.post("/add", async (req,res)=>{

    try{

        const milkAM =
        Number(req.body.milkAM || 0);

        const milkPM =
        Number(req.body.milkPM || 0);

        const dailyMilk =
        Number(req.body.dailyMilk || (milkAM + milkPM));

        if(dailyMilk <= 0){

            return res.send({

                success:false,

                message:
                "Enter milk liters"
            });
        }

        const lastEntry =
        await Entry.findOne({

            type:"milk",

            itemCode:{
                $regex:/^\d+$/
            }
        })
        .sort({
            itemCode:-1
        });

        const nextItemNumber =
        Number(lastEntry?.itemCode || 0) + 1;

        const itemCode =
        String(nextItemNumber)
        .padStart(6,"0");

        const entry =
        await Entry.create({

            ...req.body,

            itemCode,

            dailyMilk
        });

        res.send({

            success:true,

            entry
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

app.post("/delete-milk", async (req,res)=>{

    try{

        await Entry.findByIdAndDelete(
            req.body.id
        );

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

app.post("/edit-milk", async (req,res)=>{

    try{

        await Entry.findByIdAndUpdate(

            req.body.id,

            {

                milkAM:req.body.milkAM,

                milkPM:req.body.milkPM,

                discardedMilk:
                req.body.discardedMilk,

                dailyMilk:
                req.body.dailyMilk
            }
        );

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

// ======================
// REMARKS
// ======================

app.get("/remarks", async (req,res)=>{

    try{

        const remarks =
        await Remark.find()
        .sort({_id:-1});

        res.send(remarks);

    }catch(err){

        console.log(err);

        res.send([]);
    }
});

app.post("/save-remark", async (req,res)=>{

    try{

        await Remark.create({

            text:req.body.text
        });

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

app.post("/delete-remark", async (req,res)=>{

    try{

        await Remark.findByIdAndDelete(
            req.body.id
        );

        res.send({

            success:true
        });

    }catch(err){

        console.log(err);

        res.send({

            success:false
        });
    }
});

// ======================
// DASHBOARD
// ======================

app.get("/dashboard", async (req,res)=>{

    try{

        const milkEntries =
        await Entry.find({
            type:"milk"
        }).sort({date:1});

        const feeds =
        await Feed.find();

        let totalMilk = 0;
        let totalRevenue = 0;
        let totalExpense = 0;
        let totalDiscard = 0;
        let totalCalves = 0;
        let totalStaff = 0;

        const monthlyData = {};

        for(const entry of milkEntries){

            const milk =
            Number(entry.dailyMilk || 0);

            totalMilk += milk;

            totalDiscard +=
            Number(entry.discardedMilk || 0);

            totalCalves +=
            Number(entry.calfMilk || 0);

            totalStaff +=
            Number(entry.staffMilk || 0);

            const client =
            await Client.findOne({
                name:entry.client
            });

            const rate =
            Number(
                client?.pricePerLiter || 0
            );

            totalRevenue +=
            milk * rate;

            const month =
            String(entry.date).slice(0,7);

            if(!monthlyData[month]){

                monthlyData[month] = {

                    milk:0,
                    revenue:0,
                    expense:0,
                    profit:0
                };
            }

            monthlyData[month].milk += milk;

            monthlyData[month].revenue +=
            milk * rate;
        }

        feeds.forEach(feed=>{

            totalExpense +=
            Number(feed.monthlyExpense || 0);

            if(!monthlyData[feed.month]){

                monthlyData[feed.month] = {

                    milk:0,
                    revenue:0,
                    expense:0,
                    profit:0
                };
            }

            monthlyData[
                feed.month
            ].expense +=
            Number(
                feed.monthlyExpense || 0
            );
        });

        Object.keys(monthlyData)
        .forEach(month=>{

            monthlyData[month].profit =

                monthlyData[month].revenue

                -

                monthlyData[month].expense;
        });

        const totalProfit =
        totalRevenue -
        totalExpense;

        const calfAverage =

        totalCalves > 0

        ?

        (
            totalMilk /
            totalCalves
        ).toFixed(2)

        :

        0;

        const staffAverage =

        totalStaff > 0

        ?

        (
            totalMilk /
            totalStaff
        ).toFixed(2)

        :

        0;

        const latestCowCount =

        milkEntries.length > 0

        ?

        Number(
            milkEntries[
                milkEntries.length - 1
            ].cows || 0
        )

        :

        0;

        res.send({

            totalMilk,
            totalRevenue,
            totalExpense,
            totalProfit,
            totalDiscard,

            calfAverage,
            staffAverage,

            latestCowCount,

            monthlyData,

            records:milkEntries,

            feeds
        });

    }catch(err){

        console.log(err);

        res.send({
            success:false
        });
    }
});

// ======================
// HEALTH
// ======================

app.get("/health",(req,res)=>{

    res.send(
        "Server Running ✅"
    );
});

// ======================
// INVOICE COUNTER
// ======================

app.get("/invoice-counter", async (req,res)=>{

    try{

        let counter = await Counter.findOne({ name:"invoice" });

        if(!counter){

            const lastEntry = await Entry.findOne({
                type:"milk",
                itemCode:{ $regex:/^\d+$/ }
            }).sort({ itemCode:-1 });

            const startValue = Number(lastEntry?.itemCode || 0) + 1;

            counter = await Counter.create({
                name:"invoice",
                value:startValue
            });
        }

        res.send({ success:true, value:counter.value });

    }catch(err){

        res.send({ success:false, message:err.message });
    }
});

app.post("/invoice-counter/increment", async (req,res)=>{

    try{

        const counter = await Counter.findOneAndUpdate(
            { name:"invoice" },
            { $inc:{ value:1 } },
            { new:true, upsert:true }
        );

        res.send({ success:true, value:counter.value });

    }catch(err){

        res.send({ success:false, message:err.message });
    }
});

// ======================
// START SERVER
// ======================

const PORT =
process.env.PORT || 3000;

app.listen(

    PORT,

    "0.0.0.0",

    ()=>{

        console.log(
            `Server running on ${PORT}`
        );
    }
);
