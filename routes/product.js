const mongoose = require('mongoose')
const ProductSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique: true,
    },
    barcode:{
        type:String,
        unique: true,
    },
    quantity:{
        type:Number,
        required:true
    },
    price:{
        type:Number,
        required:true,
    },
    buyprice:{
        type:Number,
    },
    seller:{
        type:String,
    }
})
module.exports= mongoose.model("Product",ProductSchema);