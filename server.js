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

.then(() => {

    console.log(
        "MongoDB Connected ✅"
    );

})

.catch((err) => {

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

    pricePerLiter:Number,

    createdBy:String
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

    month:String,

    date:String,

    client:String,

    worker:String,

    cows:Number,

    milkPrice:Number,

    salary:Number,

    monthlyExpense:Number,

    dailyMilk:Number,

    milkAM:Number,

    milkPM:Number,

    discardedMilk:Number,

    // FEED ENTRY

    feedName:String,

    quantity:Number,

    cost:Number,

    // OLD FEED DATA

    feedData:Object
});

const Entry =
mongoose.model(
    "Entry",
    EntrySchema
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

                permissions:[
                    "all"
                ]
            });

            console.log(
                "Default admin created ✅"
            );
        }

    }catch(err){

        console.log(err);
    }
}

createAdmin();

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

            username:
                req.body.username,

            password:
                req.body.password,

            role:"worker",

            approved:false,

            permissions:
                req.body.permissions || []
        });

        res.send({

            success:true,

            message:
            "Account request sent to admin"
        });

    }catch(err){

        console.log(err);

        res.status(500).send({

            success:false
        });
    }
});

// ======================
// LOGIN
// ======================

app.post("/login", async (req,res)=>{

    try{

        const user =
        await User.findOne({

            username:
                req.body.username,

            password:
                req.body.password
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
                "Admin approval pending"
            });
        }

        res.send({

            success:true,

            user:{

                username:
                    user.username,

                role:
                    user.role,

                permissions:
                    user.permissions
            }
        });

    }catch(err){

        console.log(err);

        res.status(500).send({

            success:false
        });
    }
});

// ======================
// GET PENDING USERS
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

        res.status(500).send([]);
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

        res.status(500).send({

            success:false
        });
    }
});

// ======================
// CREATE CLIENT
// ======================

app.post("/create-client", async (req,res)=>{

    try{

        await Client.create({

            name:req.body.name,

            pricePerLiter:
                req.body.pricePerLiter || 0,

            createdBy:
                req.body.createdBy
        });

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

// ======================
// GET CLIENTS
// ======================

app.get("/clients", async (req,res)=>{

    try{

        const clients =
        await Client.find();

        res.send(clients);

    }catch(err){

        console.log(err);

        res.status(500).send([]);
    }
});

// ======================
// SAVE FEED
// ======================

app.post("/save-feed", async (req,res)=>{

    try{

        await Entry.create({

            type:"feed",

            feedName:
                req.body.feedName,

            quantity:
                req.body.quantity,

            cost:
                req.body.cost,

            date:
                req.body.date
        });

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

// ======================
// GET FEEDS
// ======================

app.get("/feeds", async (req,res)=>{

    try{

        const feeds =
        await Entry.find({

            type:"feed"
        })
        .sort({_id:-1});

        res.send(feeds);

    }catch(err){

        console.log(err);

        res.status(500).send([]);
    }
});

// ======================
// ADD ENTRY
// ======================

app.post("/add", async (req,res)=>{

    try{

        // OVERWRITE SAME DATE + CLIENT

        if(req.body.type === "milk"){

            await Entry.deleteMany({

                type:"milk",

                date:req.body.date,

                client:req.body.client
            });
        }

        // OVERWRITE MONTHLY

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

// ======================
// DASHBOARD
// ======================

app.get("/dashboard", async (req,res)=>{

    try{

        const selectedMonth =
            req.query.month;

        const selectedClient =
            req.query.client;

        // MONTHLY

        const monthlyEntries =
        await Entry.find({

            type:"monthly",

            ...(selectedMonth && {

                month:selectedMonth
            })
        });

        // MILK

        const milkEntries =
        await Entry.find({

            type:"milk",

            ...(selectedMonth && {

                date:{
                    $regex:
                    "^" + selectedMonth
                }
            }),

            ...(selectedClient && {

                client:selectedClient
            })
        });

        const latestMonthly =
            monthlyEntries[
                monthlyEntries.length - 1
            ];

        // ======================
        // OLD MONTHLY FORMAT
        // ======================

        const monthlyExpense =
            Number(
                latestMonthly
                ?.monthlyExpense || 0
            );

        const salary =
            Number(
                latestMonthly
                ?.salary || 0
            );

        const feed =
            latestMonthly?.feedData || {};

        const dailyFeedCost =

            (
                (feed.silagePrice || 0) *
                (feed.silageKg || 0)

            ) +

            (
                (feed.feedPrice || 0) *
                (feed.feedKg || 0)

            ) +

            (
                (feed.bhusaPrice || 0) *
                (feed.bhusaKg || 0)

            ) +

            (
                (feed.mineralPrice || 0) *
                (feed.mineralKg || 0)

            ) +

            (
                (feed.yeastPrice || 0) *
                (feed.yeastKg || 0)

            ) +

            (
                (feed.bufferPrice || 0) *
                (feed.bufferKg || 0)

            ) +

            (
                (feed.glycolPrice || 0) *
                (feed.glycolKg || 0)

            ) +

            (
                (feed.sodaPrice || 0) *
                (feed.sodaKg || 0)

            ) +

            (
                (feed.dcpPrice || 0) *
                (feed.dcpKg || 0);

        const cows =
            Number(
                latestMonthly?.cows || 0
            );

        const monthlyFeedExpense =

            dailyFeedCost *
            cows *
            30;

        const totalExpense =

            monthlyExpense +
            salary +
            monthlyFeedExpense;

        // ======================
        // MILK STATS
        // ======================

        let totalMilk = 0;

        let totalAMMilk = 0;

        let totalPMMilk = 0;

        let totalDiscardedMilk = 0;

        let totalRevenue = 0;

        for(const entry of milkEntries){

            const milk =
                Number(
                    entry.dailyMilk || 0
                );

            totalMilk += milk;

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

            const client =
            await Client.findOne({

                name:entry.client
            });

            const clientPrice =
                Number(
                    client?.pricePerLiter || 0
                );

            totalRevenue +=
                milk * clientPrice;
        }

        const totalProfit =
            totalRevenue -
            totalExpense;

        // ======================
        // RESPONSE
        // ======================

        res.send({

            totalExpense,

            totalMilk,

            totalAMMilk,

            totalPMMilk,

            totalDiscardedMilk,

            totalRevenue,

            totalProfit,

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

// ======================
// HEALTH
// ======================

app.get("/health",(req,res)=>{

    res.send(
        "Server Running ✅"
    );
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
            `Server running on port ${PORT}`
        );
    }
);