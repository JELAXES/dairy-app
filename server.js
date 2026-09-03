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

    pricePerLiter:Number,

    canInvoice:{ type:Boolean, default:true },

    milkMode:{ type:String, default:'ampm' }
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

    invoiceNumber:Number,

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
// COW SCHEMA
// ======================

const CowSchema =
new mongoose.Schema({

    name:String,

    cowId:{ type:String, unique:true },

    tagNumber:{ type:String, unique:true },

    active:{ type:Boolean, default:true }

},{

    timestamps:true
});

const Cow =
mongoose.model(
    "Cow",
    CowSchema
);

// ======================
// DAILY COW RECORD SCHEMA
// ======================

const DailyCowRecordSchema =
new mongoose.Schema({

    cowId:{ type:mongoose.Schema.Types.ObjectId, ref:"Cow", required:true },

    date:{ type:String, required:true },

    milkAM:{ type:Number, default:0 },

    milkAfternoon:{ type:Number, default:0 },

    milkPM:{ type:Number, default:0 },

    dailyMilk:{ type:Number, default:0 },

    feedGiven:{ type:Number, default:0 },

    healthNotes:{ type:String, default:"" },

    createdBy:String,

    updatedBy:String

},{

    timestamps:true
});

DailyCowRecordSchema.index({ cowId:1, date:1 },{ unique:true });
DailyCowRecordSchema.index({ date:1 });

const DailyCowRecord =
mongoose.model(
    "DailyCowRecord",
    DailyCowRecordSchema
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
// AUTH HELPERS
// ======================

function escapeRegex(str){

    return String(str || "")
    .replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

async function isAdmin(username){

    if(!username) return false;

    const user =
    await User.findOne({
        username
    });

    return !!(user && user.role === "admin");
}

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

            pricePerLiter:req.body.pricePerLiter,

            canInvoice:req.body.canInvoice !== false,

            milkMode:req.body.milkMode || 'ampm'
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

app.post("/update-client-settings", async (req,res)=>{

    try{

        const update = {};

        if(req.body.canInvoice !== undefined) update.canInvoice = req.body.canInvoice;
        if(req.body.milkMode !== undefined) update.milkMode = req.body.milkMode;

        await Client.findByIdAndUpdate(req.body.id, { $set:update });

        res.send({ success:true });

    }catch(err){

        res.send({ success:false });
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

async function assignNextInvoiceNumber(client){

    const counterName = `invoice_${client}`;

    let counter = await Counter.findOne({ name:counterName });

    if(!counter){

        const lastEntry = await Entry.findOne({
            type:"milk",
            client,
            invoiceNumber:{ $exists:true, $gt:0 }
        }).sort({ invoiceNumber:-1 });

        const startValue = (lastEntry?.invoiceNumber || 0) + 1;

        counter = await Counter.findOneAndUpdate(
            { name:counterName },
            { $setOnInsert:{ value:startValue } },
            { new:true, upsert:true }
        );
    }

    const assigned = await Counter.findOneAndUpdate(
        { name:counterName },
        { $inc:{ value:1 } },
        { new:false }
    );

    return assigned.value;
}

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

        let invoiceNumber;

        if(req.body.client){

            const clientDoc =
            await Client.findOne({ name:req.body.client });

            if(clientDoc && clientDoc.canInvoice !== false){

                invoiceNumber =
                await assignNextInvoiceNumber(req.body.client);
            }
        }

        const entry =
        await Entry.create({

            ...req.body,

            itemCode,

            dailyMilk,

            ...(invoiceNumber ? { invoiceNumber } : {})
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

        const entry = await Entry.findById(req.body.id);

        const deletedInvoiceNumber = entry?.invoiceNumber;
        const deletedItemCode = entry?.itemCode;

        await Entry.findByIdAndDelete(req.body.id);

        if(deletedInvoiceNumber){

            await Entry.updateMany(
                { client:entry.client, invoiceNumber:{ $gt:deletedInvoiceNumber } },
                { $inc:{ invoiceNumber:-1 } }
            );

            const counterName = entry.client ? `invoice_${entry.client}` : "invoice";

            await Counter.findOneAndUpdate(
                { name:counterName },
                { $inc:{ value:-1 } },
                { upsert:true }
            );
        }

        if(deletedItemCode && /^\d+$/.test(deletedItemCode)){

            const higherEntries = await Entry.find({ itemCode:{ $gt:deletedItemCode } });

            for(const e of higherEntries){

                if(/^\d+$/.test(e.itemCode)){

                    await Entry.findByIdAndUpdate(e._id, {
                        itemCode: String(Number(e.itemCode) - 1).padStart(6, '0')
                    });
                }
            }
        }

        res.send({ success:true });

    }catch(err){

        console.log(err);

        res.send({ success:false });
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
// COWS
// ======================

app.post("/create-cow", async (req,res)=>{

    try{

        const tagNumber = String(req.body.tagNumber || "").trim();

        if(!tagNumber){

            return res.send({
                success:false,
                message:"Cow Tag is required"
            });
        }

        const duplicate = await Cow.findOne({
            tagNumber:{ $regex:`^${escapeRegex(tagNumber)}$`, $options:"i" }
        });

        if(duplicate){

            return res.send({
                success:false,
                message:"Cow Tag already exists"
            });
        }

        const cow = await Cow.create({
            name:tagNumber,
            cowId:tagNumber,
            tagNumber,
            active:true
        });

        res.send({ success:true, cow });

    }catch(err){

        console.log(err);

        res.send({
            success:false,
            message:"Could not create cow"
        });
    }
});

app.get("/cows", async (req,res)=>{

    try{

        const date = req.query.date || "";
        const includeInactive = req.query.includeInactive === "true";

        const filter = includeInactive ? {} : { active:{ $ne:false } };

        const cows =
        await Cow.find(filter)
        .sort({ name:1 });

        const todayMap = new Map();

        if(date && cows.length){

            const todayRecords =
            await DailyCowRecord.find({
                date,
                cowId:{ $in:cows.map(c => c._id) }
            });

            todayRecords.forEach(r => todayMap.set(String(r.cowId), r));
        }

        const result = cows.map(c => {

            const rec = todayMap.get(String(c._id));

            return {
                ...c.toObject(),
                todayRecord: rec ? {
                    milkAM:rec.milkAM || 0,
                    milkAfternoon:rec.milkAfternoon || 0,
                    milkPM:rec.milkPM || 0,
                    dailyMilk:rec.dailyMilk || 0,
                    feedGiven:rec.feedGiven || 0
                } : null
            };
        });

        res.send({ success:true, cows:result });

    }catch(err){

        console.log(err);

        res.send({ success:false, cows:[] });
    }
});

app.get("/cow/:id", async (req,res)=>{

    try{

        const cow = await Cow.findById(req.params.id);

        if(!cow){
            return res.send({ success:false, message:"Cow not found" });
        }

        res.send({ success:true, cow });

    }catch(err){

        res.send({ success:false, message:"Could not fetch cow" });
    }
});

app.post("/edit-cow", async (req,res)=>{

    try{

        if(!(await isAdmin(req.body.username))){
            return res.send({ success:false, message:"Admin access required" });
        }

        const id = req.body.id;
        const tagNumber = String(req.body.tagNumber || "").trim();

        if(!id || !tagNumber){

            return res.send({
                success:false,
                message:"Cow Tag is required"
            });
        }

        const duplicate = await Cow.findOne({
            _id:{ $ne:id },
            tagNumber:{ $regex:`^${escapeRegex(tagNumber)}$`, $options:"i" }
        });

        if(duplicate){

            return res.send({
                success:false,
                message:"Cow Tag already exists"
            });
        }

        await Cow.findByIdAndUpdate(id, { name:tagNumber, cowId:tagNumber, tagNumber });

        res.send({ success:true });

    }catch(err){

        console.log(err);

        res.send({ success:false, message:"Could not update cow" });
    }
});

app.post("/set-cow-active", async (req,res)=>{

    try{

        if(!(await isAdmin(req.body.username))){
            return res.send({ success:false, message:"Admin access required" });
        }

        await Cow.findByIdAndUpdate(req.body.id, {
            active: !!req.body.active
        });

        res.send({ success:true });

    }catch(err){

        console.log(err);

        res.send({ success:false, message:"Could not update cow status" });
    }
});

// ======================
// DAILY COW RECORDS
// ======================

app.post("/save-daily-cow-record", async (req,res)=>{

    try{

        const cowId = req.body.cowId;
        const date = String(req.body.date || "").trim();
        const worker = req.body.worker || "Worker";

        if(!cowId || !date){

            return res.send({
                success:false,
                message:"Cow and date are required"
            });
        }

        const cow = await Cow.findById(cowId);

        if(!cow){
            return res.send({ success:false, message:"Cow not found" });
        }

        const milkAM = Number(req.body.milkAM || 0);
        const milkAfternoon = Number(req.body.milkAfternoon || 0);
        const milkPM = Number(req.body.milkPM || 0);
        const feedGiven = Number(req.body.feedGiven || 0);
        const healthNotes = String(req.body.healthNotes || "").trim();
        const dailyMilk = milkAM + milkAfternoon + milkPM;

        const existing =
        await DailyCowRecord.findOne({ cowId, date });

        let record;

        if(existing){

            existing.milkAM = milkAM;
            existing.milkAfternoon = milkAfternoon;
            existing.milkPM = milkPM;
            existing.dailyMilk = dailyMilk;
            existing.feedGiven = feedGiven;
            existing.healthNotes = healthNotes;
            existing.updatedBy = worker;

            record = await existing.save();

        }else{

            record = await DailyCowRecord.create({
                cowId,
                date,
                milkAM,
                milkAfternoon,
                milkPM,
                dailyMilk,
                feedGiven,
                healthNotes,
                createdBy:worker,
                updatedBy:worker
            });
        }

        res.send({ success:true, record });

    }catch(err){

        console.log(err);

        res.send({
            success:false,
            message:"Could not save daily record"
        });
    }
});

app.get("/daily-cow-record", async (req,res)=>{

    try{

        const { cowId, date } = req.query;

        if(!cowId || !date){
            return res.send({ success:true, record:null });
        }

        const record =
        await DailyCowRecord.findOne({ cowId, date });

        res.send({ success:true, record });

    }catch(err){

        res.send({ success:false, record:null });
    }
});

app.get("/daily-cow-records", async (req,res)=>{

    try{

        const { cowId, from, to } = req.query;

        if(!cowId){
            return res.send({ success:false, records:[] });
        }

        const filter = { cowId };

        if(from || to){

            filter.date = {};

            if(from) filter.date.$gte = from;
            if(to) filter.date.$lte = to;
        }

        const records =
        await DailyCowRecord.find(filter)
        .sort({ date:1 });

        res.send({ success:true, records });

    }catch(err){

        res.send({ success:false, records:[] });
    }
});

// ======================
// COW STATISTICS
// ======================

app.get("/cow-stats", async (req,res)=>{

    try{

        const { cowId, from, to, date } = req.query;

        if(!cowId){
            return res.send({ success:false, message:"cowId required" });
        }

        const cow = await Cow.findById(cowId);

        if(!cow){
            return res.send({ success:false, message:"Cow not found" });
        }

        const filter = { cowId };

        if(from || to){

            filter.date = {};

            if(from) filter.date.$gte = from;
            if(to) filter.date.$lte = to;
        }

        const records =
        await DailyCowRecord.find(filter)
        .sort({ date:1 });

        const totalMilk =
        records.reduce((s,r) => s + Number(r.dailyMilk || 0), 0);

        const totalFeed =
        records.reduce((s,r) => s + Number(r.feedGiven || 0), 0);

        const daysRecorded = records.length;

        const avgDailyMilk =
        daysRecorded > 0 ? totalMilk / daysRecorded : 0;

        let todayMilk = 0;

        if(date){

            const todayRecord =
            records.find(r => r.date === date) ||
            await DailyCowRecord.findOne({ cowId, date });

            todayMilk = Number(todayRecord?.dailyMilk || 0);
        }

        res.send({
            success:true,
            cow,
            todayMilk,
            totalMilk,
            avgDailyMilk,
            totalFeed,
            daysRecorded,
            records
        });

    }catch(err){

        console.log(err);

        res.send({
            success:false,
            message:"Could not load cow stats"
        });
    }
});

app.get("/admin-cow-stats", async (req,res)=>{

    try{

        if(!(await isAdmin(req.query.username))){
            return res.send({ success:false, message:"Admin access required" });
        }

        const { from, to, date } = req.query;

        const cows =
        await Cow.find()
        .sort({ name:1 });

        const dateFilter = {};

        if(from || to){

            dateFilter.date = {};

            if(from) dateFilter.date.$gte = from;
            if(to) dateFilter.date.$lte = to;
        }

        const records = await DailyCowRecord.find(dateFilter);

        const byCow = new Map();

        records.forEach(r => {

            const key = String(r.cowId);

            if(!byCow.has(key)) byCow.set(key,[]);

            byCow.get(key).push(r);
        });

        let totalMilk = 0;
        let totalFeed = 0;

        const cowBreakdown = cows.map(c => {

            const recs = byCow.get(String(c._id)) || [];

            const cowMilk =
            recs.reduce((s,r) => s + Number(r.dailyMilk || 0), 0);

            const cowFeed =
            recs.reduce((s,r) => s + Number(r.feedGiven || 0), 0);

            const daysRecorded = recs.length;

            const avgDailyMilk =
            daysRecorded > 0 ? cowMilk / daysRecorded : 0;

            totalMilk += cowMilk;
            totalFeed += cowFeed;

            let todayMilk = 0;
            let lastUpdatedBy = "";
            let lastUpdatedAt = null;

            if(recs.length){

                const sorted =
                recs.slice()
                .sort((a,b) => String(a.date).localeCompare(String(b.date)));

                const last = sorted[sorted.length - 1];

                lastUpdatedBy = last.updatedBy || last.createdBy || "";
                lastUpdatedAt = last.updatedAt;

                if(date){

                    const todayRec = recs.find(r => r.date === date);

                    todayMilk = Number(todayRec?.dailyMilk || 0);
                }
            }

            return {
                _id:c._id,
                tagNumber:c.tagNumber,
                active:c.active,
                todayMilk,
                totalMilk:cowMilk,
                totalFeed:cowFeed,
                avgDailyMilk,
                daysRecorded,
                lastUpdatedBy,
                lastUpdatedAt
            };
        });

        const activeCows =
        cows.filter(c => c.active !== false).length;

        res.send({
            success:true,
            totalCows:cows.length,
            activeCows,
            totalMilk,
            totalFeed,
            avgMilkPerCow:
            activeCows > 0 ? totalMilk / activeCows : 0,
            cows:cowBreakdown
        });

    }catch(err){

        console.log(err);

        res.send({
            success:false,
            message:"Could not load farm cow statistics"
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
// RENUMBER INVOICES
// ======================

app.post("/renumber-invoices", async (req,res)=>{

    try{

        const { client, startNumber } = req.body;
        const start = Number(startNumber);

        if(!client || isNaN(start) || start < 1){
            return res.send({ success:false, message:"Invalid client or startNumber" });
        }

        const entries = await Entry.find({
            type:"milk",
            client:client
        }).sort({ date:1, _id:1 });

        for(let i = 0; i < entries.length; i++){
            await Entry.findByIdAndUpdate(entries[i]._id, { invoiceNumber: start + i });
        }

        const counterName = `invoice_${client}`;
        await Counter.findOneAndUpdate(
            { name:counterName },
            { value: start + entries.length },
            { upsert:true }
        );

        res.send({ success:true, updated: entries.length });

    }catch(err){

        res.send({ success:false, message:err.message });
    }
});

// ======================
// SAVE INVOICE NUMBER
// ======================

app.post("/save-invoice-number", async (req,res)=>{

    try{

        await Entry.findByIdAndUpdate(
            req.body.id,
            { invoiceNumber:req.body.invoiceNumber }
        );

        res.send({ success:true });

    }catch(err){

        res.send({ success:false, message:err.message });
    }
});

// ======================
// INVOICE COUNTER
// ======================

app.get("/invoice-counter", async (req,res)=>{

    try{

        const client = req.query.client || "";
        const counterName = client ? `invoice_${client}` : "invoice";

        let counter = await Counter.findOne({ name:counterName });

        if(!counter){

            let startValue = 1;

            if(client){

                const lastEntry = await Entry.findOne({
                    type:"milk",
                    client:client,
                    invoiceNumber:{ $exists:true, $gt:0 }
                }).sort({ invoiceNumber:-1 });

                startValue = (lastEntry?.invoiceNumber || 0) + 1;

            }else{

                const lastEntry = await Entry.findOne({
                    type:"milk",
                    itemCode:{ $regex:/^\d+$/ }
                }).sort({ itemCode:-1 });

                startValue = Number(lastEntry?.itemCode || 0) + 1;
            }

            counter = await Counter.create({ name:counterName, value:startValue });
        }

        res.send({ success:true, value:counter.value });

    }catch(err){

        res.send({ success:false, message:err.message });
    }
});

app.post("/invoice-counter/increment", async (req,res)=>{

    try{

        const client = req.body.client || "";
        const counterName = client ? `invoice_${client}` : "invoice";

        const counter = await Counter.findOneAndUpdate(
            { name:counterName },
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
