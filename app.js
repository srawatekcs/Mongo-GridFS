const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const GridFile = require('./model/grid.js')

dotenv.config()
const upload = multer({ dest: path.join(__dirname, '.') })
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')


mongoose.connect(process.env.DATABASE_URL).then(()=>{console.log("Connected to Database")}).catch((err)=>{
    console.log(err)
})


app.get("/test", (req,res)=>{
    res.render("test")
})


app.get("/console", (req,res)=>{
    res.render("console")
})


app.get("/", (req,res)=>{
    res.status(200).send("Listening !!!");
})
app.post('/upload/:name', upload.any(), async (req, res, nxt) => {
    try {
      // uploaded file are accessible as req.files
      if (req.files) {
        const promises = req.files.map(async (file) => {
          const fileStream = fs.createReadStream(file.path)
  
          // upload file to gridfs
       
          const gridFile = new GridFile({ filename: req.params.name + "+" + file.originalname })
          await gridFile.upload(fileStream)
  
          // delete the file from local folder
          fs.unlinkSync(file.path)
        })
  
        await Promise.all(promises)
      }
  
      res.sendStatus(201)
    } catch (err) {
      nxt(err)
    }
  })

app.get("/console/:name", async (req,res)=>{
    let name = req.params.name
    const files = await GridFile.find( {"filename": {"$regex": name + "+"}}).sort({ uploadDate: -1 }).limit(10);
    data = files.map((file)=>{
        return "/getfile/" + file._id + "/" + file.filename
    })
    res.render("name", {data: data, name: name})
})

app.get('/getfile/:id/:name', async (req, res, nxt) => {
    try {
      const { id, name } = req.params
  
      const gridFile = await GridFile.findById(id)
  
      if (gridFile) {
        res.attachment(name)
        gridFile.downloadStream(res)
      } else {
        // file not found
        res.status(404).json({ error: 'file not found' })
      }
    } catch (err) {
      nxt(err)
    }
  })

app.listen(PORT, (err)=>{
    if(err)
    console.log("Error");
    else
    console.log("Server is listening on PORT: " + PORT)
})

