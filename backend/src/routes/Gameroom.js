const express = require("express");
const router = express.Router();
const {Gameroom} = require("../models/Gameroom");
const db = require("../util/GameroomUtil");//db관련 함수 처리 모아놓은 파일

//room json들의 배열을 send함
router.get('/getAll', (req,res) => {
    db.getAll((rooms) => {
        res.status(200).send(rooms);
    })
})

router.post('/addRoom', (req,res) => {
    db.addRoom(req.body, ()=>{
        res.status(200).send();
    })
})

router.get('/findCurrentRoom', (req,res) => {
    db.findCurrentRoom(req.body, (_id) => {
        res.status(200).send(_id);
    })
})

router.post('/joinRoom', (req,res) => {
    //console.log(req.body)
    db.joinRoom(req.body, ()=> {
        res.status(200).send();
    })
})

router.post('/exitRoom', (req,res) => {
    //console.log(req.body)
    db.exitRoom(req.body, ()=> {
        res.status(200).send();
    })
})

module.exports = router;