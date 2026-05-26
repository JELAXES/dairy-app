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

    month:String,

    date:String,

    client:String,

    worker:String,

    dailyMilk:Number,

    milkAM:Number,

    milkPM:Number,

    discardedMilk:Number,

    monthlyExpense:Number
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

    quantity:Number,

    cost:Number,

    date:String
});

const Feed =
mongoose.model(
    "Feed",
    FeedSchema
);

// ======================
// DEFAULT ADMIN
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
// CREATE CLIENT
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

// ======================
// GET CLIENTS
// ======================

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

// ======================
// DELETE CLIENT
// ======================

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

// ======================
// EDIT CLIENT
// ======================

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
// SAVE FEED
// ======================

app.post("/save-feed", async (req,res)=>{

    try{

        const saved =
        await Feed.create({

            feedName:req.body.feedName,

            quantity:req.body.quantity,

            cost:req.body.cost,

            date:req.body.date
        });

        console.log(saved);

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
// GET FEEDS
// ======================

app.get("/feeds", async (req,res)=>{

    try{

        // OLD FEEDS

        const oldFeeds =
        await Entry.find({

            type:"feed"
        });

        // NEW FEEDS

        const newFeeds =
        await Feed.find();

        // MERGE

        const allFeeds = [

            ...oldFeeds,

            ...newFeeds
        ];

        // SORT

        allFeeds.sort((a,b)=>

            new Date(b.date) -
            new Date(a.date)
        );

        res.send(allFeeds);

    }catch(err){

        console.log(err);

        res.send([]);
    }
});

// ======================
// ADD MILK ENTRY
// ======================

app.post("/add", async (req,res)=>{

    try{

        await Entry.create(
            req.body
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
        });

        let totalMilk = 0;

        let totalRevenue = 0;

        let totalDiscardedMilk = 0;

        for(const entry of milkEntries){

            const milk =
            Number(
                entry.dailyMilk || 0
            );

            totalMilk += milk;

            totalDiscardedMilk +=
            Number(
                entry.discardedMilk || 0
            );

            const client =
            await Client.findOne({

                name:entry.client
            });

            const rate =
            Number(

                client
                ?.pricePerLiter || 0
            );

            totalRevenue +=
            milk * rate;
        }

        const latestMonthly =
        await Entry.findOne({

            type:"monthly"
        })
        .sort({_id:-1});

        const totalExpense =
        Number(

            latestMonthly
            ?.monthlyExpense || 0
        );

        const totalProfit =
        totalRevenue -
        totalExpense;

        res.send({

            totalMilk,

            totalRevenue,

            totalExpense,

            totalProfit,

            totalDiscardedMilk,

            records:milkEntries
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