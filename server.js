const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ======================
// MONGODB
// ======================

mongoose.connect(
process.env.MONGO_URI
);

// ======================
// SCHEMAS
// ======================

const UserSchema =
new mongoose.Schema({

    username:String,

    password:String,

    approved:{
        type:Boolean,
        default:false
    }
});

const ClientSchema =
new mongoose.Schema({

    name:String,

    pricePerLiter:Number
});

const FeedSchema =
new mongoose.Schema({

    feedName:String,

    quantity:Number,

    cost:Number,

    month:String
});

const EntrySchema =
new mongoose.Schema({

    type:String,

    client:String,

    worker:String,

    date:String,

    milkAM:Number,

    milkPM:Number,

    discardedMilk:Number,

    dailyMilk:Number,

    cows:Number,

    calves:Number,

    staff:Number
});

const RemarkSchema =
new mongoose.Schema({

    text:String
});

// ======================
// MODELS
// ======================

const User =
mongoose.model(
"User",
UserSchema
);

const Client =
mongoose.model(
"Client",
ClientSchema
);

const Feed =
mongoose.model(
"Feed",
FeedSchema
);

const Entry =
mongoose.model(
"Entry",
EntrySchema
);

const Remark =
mongoose.model(
"Remark",
RemarkSchema
);

// ======================
// AUTH
// ======================

app.post("/signup", async(req,res)=>{

    const user =
    new User(req.body);

    await user.save();

    res.send({
        success:true
    });
});

app.post("/login", async(req,res)=>{

    const user =
    await User.findOne({

        username:req.body.username,

        password:req.body.password
    });

    if(!user){

        return res.send({
            success:false
        });
    }

    res.send({

        success:true,

        approved:user.approved
    });
});

// ======================
// APPROVE USERS
// ======================

app.get("/pending-users", async(req,res)=>{

    const users =
    await User.find({

        approved:false
    });

    res.send(users);
});

app.post("/approve-user", async(req,res)=>{

    await User.findByIdAndUpdate(

        req.body.id,

        {
            approved:true
        }
    );

    res.send({
        success:true
    });
});

// ======================
// CLIENTS
// ======================

app.post("/create-client", async(req,res)=>{

    const client =
    new Client(req.body);

    await client.save();

    res.send({
        success:true
    });
});

app.get("/clients", async(req,res)=>{

    const clients =
    await Client.find();

    res.send(clients);
});

app.post("/delete-client", async(req,res)=>{

    await Client.findByIdAndDelete(
        req.body.id
    );

    res.send({
        success:true
    });
});

// ======================
// FEED
// ======================

app.post("/save-feed", async(req,res)=>{

    const feed =
    new Feed(req.body);

    await feed.save();

    res.send({
        success:true
    });
});

app.get("/feeds", async(req,res)=>{

    const feeds =
    await Feed.find()
    .sort({_id:-1});

    res.send(feeds);
});

app.post("/delete-feed", async(req,res)=>{

    await Feed.findByIdAndDelete(
        req.body.id
    );

    res.send({
        success:true
    });
});

// ======================
// MILK ENTRIES
// ======================

app.post("/add", async(req,res)=>{

    const entry =
    new Entry(req.body);

    await entry.save();

    res.send({
        success:true
    });
});

app.post("/delete-milk", async(req,res)=>{

    await Entry.findByIdAndDelete(
        req.body.id
    );

    res.send({
        success:true
    });
});

app.post("/edit-milk", async(req,res)=>{

    await Entry.findByIdAndUpdate(

        req.body.id,

        {

            milkAM:req.body.milkAM,

            milkPM:req.body.milkPM,

            discardedMilk:req.body.discardedMilk,

            dailyMilk:req.body.dailyMilk
        }
    );

    res.send({
        success:true
    });
});

// ======================
// REMARKS
// ======================

app.post("/save-remark", async(req,res)=>{

    const remark =
    new Remark(req.body);

    await remark.save();

    res.send({
        success:true
    });
});

app.get("/remarks", async(req,res)=>{

    const remarks =
    await Remark.find()
    .sort({_id:-1});

    res.send(remarks);
});

// ======================
// DASHBOARD
// ======================

app.get("/dashboard", async(req,res)=>{

    try{

        const milkEntries =
        await Entry.find({

            type:"milk"
        })
        .sort({_id:-1});

        let totalMilk = 0;
        let totalRevenue = 0;
        let totalExpense = 0;
        let totalDiscard = 0;

        let totalCows = 0;
        let totalCalves = 0;
        let totalStaff = 0;

        for(const entry of milkEntries){

            const milk =
            Number(
                entry.dailyMilk || 0
            );

            totalMilk += milk;

            totalDiscard +=
            Number(
                entry.discardedMilk || 0
            );

            totalCows +=
            Number(
                entry.cows || 0
            );

            totalCalves +=
            Number(
                entry.calves || 0
            );

            totalStaff +=
            Number(
                entry.staff || 0
            );

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
        }

        const feeds =
        await Feed.find();

        feeds.forEach(feed => {

            totalExpense +=
            Number(feed.cost || 0);
        });

        const totalProfit =
        totalRevenue -
        totalExpense;

        const cowAverage =
        totalCows > 0
        ?
        (
            totalMilk / totalCows
        ).toFixed(2)
        :
        0;

        const calfAverage =
        totalCalves > 0
        ?
        (
            totalMilk / totalCalves
        ).toFixed(2)
        :
        0;

        const staffAverage =
        totalStaff > 0
        ?
        (
            totalMilk / totalStaff
        ).toFixed(2)
        :
        0;

        res.send({

            totalMilk,

            totalRevenue,

            totalExpense,

            totalProfit,

            totalDiscard,

            cowAverage,

            calfAverage,

            staffAverage,

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
// START SERVER
// ======================

const PORT =
process.env.PORT || 3000;

app.listen(PORT, ()=>{

    console.log(
        "Server Running"
    );
});