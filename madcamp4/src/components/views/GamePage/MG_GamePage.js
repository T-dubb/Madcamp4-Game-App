import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle  } from 'react'
import "./MG_GamePage.css"
import { withRouter } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles';
import Oppo_player from './Oppo_player';
import io from "socket.io-client";
import { useSelector } from "react-redux";
import MuiAlert from '@material-ui/lab/Alert';
import axios from "axios";
import { green } from '@material-ui/core/colors';
import { Canvas } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";

function getModalStyle() {
    const top = 50 
    const left = 50
  
    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${top}%, -${left}%)`,
     
    };
  }

function Alert(props) {
    return <MuiAlert elevation={3} variant="filled" {...props} />;
}

const useStyles = makeStyles((theme) => ({
    root: {
      display: 'flex',
      '& > *': {
        margin: theme.spacing(1),
      },
    },
    square: {
      color: "white",
      fontFamily: "game",
      fontSize: "40px"
      
    },
    rounded: {
      color: '#fff',
      backgroundColor: green[500],
    },
    paper: {
        position: 'absolute',
        width: 610,
        backgroundColor: theme.palette.background.paper,
        borderRadius: "20px",
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
        zIndex: 200
      },
  }));


let Socket

function MG_GamePage() {
    const classes = useStyles();
    const user = useSelector(state => state.user)
    const playerId = user.userData?._id
    const playerName = user.userData?.name
    const [roomInfo, setRoomInfo] = useState()
    const [Items, setItems] = useState("Wait...")
    const [myIndex, setMyIndex] = useState(-1)
    const [Players, setPlayers] = useState(["waiting"])
    const [host, setHost] = useState()
    const [Bet, setBet] = useState(0)
    const [Dragable, setDragable] = useState(true)
    const [Playing, setPlaying] = useState(false)
    const [Chips, setChips] = useState([])
    const [curTurn, setCurTurn] = useState(-1)
    const [curBid, setCurBid] = useState(0)
    const [playerBids, setPlayerBids] = useState([])
    const [BidStatus, setBidStatus] = useState([])//??????????????? ?????? bid ????????? index

    const [clickChip, setClickChip] = useState()
    const tableRef = useRef()
    const chipYRef = useRef()
    const chipXRef = useRef()
    const chipRef = useRef()
    const [isMyturn, setIsMyturn] = useState("notmyTurn")
    const [startCondition, setStartCondition] = useState(false);
    const [startAlert, setStartAlert] = useState(false);
    const [isResult, setResult] = useState(false);
    const [Result, setPlayResult] = useState([]);
    const [Result2, setResult2] = useState([]);
    const [Force, setForce] = useState(false);
    
    const waiting = [0, 1, 2, 3, 4, 5];
    const Grade = ["st", "nd", "th", "th", "th", "th"];


    useEffect(() => {

        Socket = io('http://192.249.18.179:80')
        // Socket = io('http://192.249.18.171:80')
        Socket.on('playerCome', (newPlayers) => {
            console.log('new player come')
            if(newPlayers){
                console.log("change check")
                setPlayers(newPlayers)
            }
        })

        Socket.on('playerLeave', (newPlayers) => {
            console.log('player leave')
            if(newPlayers){
                setPlayers(newPlayers)
            }
        })
        Socket.on('startGame', (data) => {
            // ????????? ?????? ??????
            var bidItems = data.items
            setPlaying(true)
            setCurBid(bidItems.pop())
            setItems(bidItems)
            console.log('Start Game!!!',bidItems)
            setChips(data.Chips)
            setBet(0)
            setCurTurn(data.curTurn)
            setPlayerBids(data.initBids)
            setBidStatus(data.initTotal)
            setStartAlert(true);
        })
        Socket.on('unexpectedLeave', (leaveRoom) => {
            console.log("unexpectedLeave", leaveRoom)
            axios.post('/api/gameroom/getPlayersInfo', leaveRoom)
            .then(res => {
                console.log("after leave player", res.data)
                setPlayers(res.data)
            })
            // axios.post('/api/gameroom/findCurrentRoom', {user: leaveId})
            // .then(res => {
            //     console.log("undexpectedcheck",leaveId, res.data);
            //     if(res.data==null){
            //         return;
            //     }
            //     axios.post('/api/gameroom/exitRoom',
            //     {playerId: leaveId, roomId: res.data._id})
            //     .then(res => {
            //         if(res.data){
            //             axios.post('/api/gameroom/getPlayersInfo', res.data)
            //             .then(res => {
            //                 setPlayers(res.data)
            //     })
            //         }
            //     })
            // })    
        } )
        Socket.on('turnInfo', (turnInfo) => {
            setChips(turnInfo.Chips)
            setBet(turnInfo.Bet)
            setCurTurn(turnInfo.curTurn)
        })

        Socket.on('nackchal', (nackchalInfo) => {
            console.log("????????????", nackchalInfo.playerBids)
            setPlayerBids(nackchalInfo.playerBids)
            setCurBid(nackchalInfo.curBid)
            setBidStatus(nackchalInfo.BidStatus)
            setItems(nackchalInfo.Items)
            console.log("????????????status", nackchalInfo.BidStatus)
        })

        Socket.on('FinishGame', (finishInfo) => {
            if(finishInfo.Players == undefined){
                return;
            }
            setPlaying(finishInfo.Playing)
            console.log("????????????", finishInfo.scores, finishInfo.playerName)
            console.log("???????????? ?????? Players", finishInfo.Players)
            var tempResult = finishInfo.scores.map((score,index) => ({score: score, username: finishInfo.Players[index].name}))
            tempResult.sort(function(a,b) {
                return (b.score - a.score);
            })
            console.log("tempResult",tempResult);
            setResult2(tempResult)
            setPlayResult(finishInfo.scores)
            setResult(true)
        })
    }, [])

    //player ????????????
    useEffect(() => {
        if(Players != null){
            console.log('hostplayer',Players[0])
            setHost(Players[0])
        }
        for(var i = 0 ; i <= Players.length ; i++){
            if(Players[i]?._id == playerId){
                console.log("myindex",i);
                setMyIndex(i);
            }
        }
    }, [Players])

    useEffect(() => {
        if(playerId != null){
            console.log("before enterroom id",playerId)
            axios.post('/api/gameroom/findCurrentRoom', { user: playerId })
                .then(response => {
                    var tempRoomInfo = response.data
                    console.log("i found room Info", response.data)
                    if (response.data) {
                        axios.post('/api/gameroom/getPlayersInfo', response.data)
                        .then(response => {
                            console.log("detail playersInfo", response.data)
                            if(response.data){
                                setPlayers(response.data)
                                Socket.emit('enterRoom', tempRoomInfo, response.data, playerId)
                            }
                        })
                        setRoomInfo(response.data);
    
                    }
                })
        }
    }, [user])

    useEffect(() => {
        if (Chips[myIndex] <= 0) {
            setDragable(false)
        }
        else{
            setDragable(true)
        }
        
        
    }, [Chips])

    useEffect(() => {
        console.log("my chip???", Chips[myIndex])
        if(curTurn == myIndex && Chips[myIndex]<=0 ){
            setForce(true)
        }
    }, [curTurn])

    useEffect(() => {
        if(curTurn == myIndex && Chips[myIndex]<=0 ){
            setForce(true)
        }
        if(curTurn == myIndex){
            setIsMyturn("myTurn")
            console.log("myTurn!")
        }
        else{
            setIsMyturn("notmyTurn")
            console.log("notmyTurn!")
        }
    },[curTurn])
    useEffect(() => {
        if(Items.length < 1){
            setPlaying(false)
            //alert("?????? ??????")
            var scores= whoIsWinner()
            Socket.emit('FinishGame', false, scores, playerName, roomInfo, Players )
            return;
        }
        
    }, [Items])

    const startClick = () => {
        if(Players.length <=1){
            setStartCondition(true);
            return;
        }
        setPlaying(true)
        var initChips = Players.map(player => 10)
        var initBids = Players.map(player => [])
        var temp = {totalBids: 0, activeIndex: []}
        var initTotal = Players.map(player => temp)
        var firstTurn = Ordering()
        console.log("firstTurn", firstTurn)
        Socket.emit('startClick', roomInfo, initChips, firstTurn, initBids, initTotal)
        //??? ??? ??????
        console.log("initChips and Bids", initChips, initBids, initTotal)
        setChips(initChips);
    }

    
    const Ordering = () => {
        //var ResultOrder = Players.sort(() => Math.random() - 0.5);
        var FirstPlayer = Math.floor(Math.random() * Players.length)
        //??? ?????? ????????????
        console.log("start ordering", FirstPlayer);
        setCurTurn(FirstPlayer);
        return(FirstPlayer)
    }


    // const Chip = () => {
    //     const [{ isDragging, canDrag }, drag] = useDrag({
    //         type: 'chip',
    //         item: { name: 'chip' },
    //         end: (item, monitor) => {
    //             const dropResult = monitor.getDropResult()
    //             if (dropResult && dropResult.name === 'table') {
    //                 //chip array ??????
    //                 Chips.splice(myIndex, 1, Chips[myIndex] - 1);
                    
    //                 console.log(Chips)
    //                 setChips(Chips)
    //                 setBet(Bet + 1)
    //                 if(curTurn == (Players.length - 1)){
    //                     setCurTurn(0)
    //                     Socket.emit('turnInfo', {Chips: Chips, Bet: Bet+1, curTurn: 0})
    //                 }
    //                 else{
    //                     setCurTurn(curTurn+1)
    //                     Socket.emit('turnInfo', {Chips: Chips, Bet: Bet+1, curTurn: curTurn+1})
    //                 }
    //             }
    //         },
    //         collect: (monitor) => ({
    //             isDragging: monitor.isDragging(),
    //             canDrag: monitor.canDrag()
    //         }),
    //     });

    //     const opacity = isDragging ? 0.4 : 1;

    //     return (
    //         <div className='chip' ref={drag} style={{ opacity }}>
    //             ?????? ??????
    //         </div>
    //     )
    // }

    const Chip = forwardRef((props, ref) => {
        useImperativeHandle(ref, () => ({
            fall(chip) {
                console.log("fallfallfall")
                chipYRef.current.style.transform=`translateY(${chip.terminalY - chip.originY}px)`;
                chipXRef.current.style.transform=`translateX(${chip.terminalX - chip.originX}px)`;
                setTimeout(()=>{
                    Chips.splice(myIndex, 1, Chips[myIndex] - 1);
                        
                    console.log(Chips)
                    setChips(Chips)
                    setBet(Bet + 1)
                    if(curTurn == (Players.length - 1)){
                        setCurTurn(0)
                        Socket.emit('turnInfo', {Chips: Chips, Bet: Bet+1, curTurn: 0}, roomInfo)
                    }
                    else{
                        setCurTurn(curTurn+1)
                        Socket.emit('turnInfo', {Chips: Chips, Bet: Bet+1, curTurn: curTurn+1}, roomInfo)
                    }
                }, 900)
            }, 
            init(chip) {
                chipYRef.current.style.top=`${chip.originY}px`;
                chipYRef.current.style.left=`${chip.originX}px`;
                // if(chip.originY > chip.terminalY){
                //     chipYRef.current.style.transition = "all .4s cubic-bezier(0,.3,.55,1.62)"
                // }
                console.log("dasdasd", chip.id);
                setTimeout(()=>{
                    this.fall(chip)
                },0)
            },
    
            
        }))

        return (
            <div  className='chip-y' ref={chipYRef}>
                <div className='chip-x' ref={chipXRef}>
                </div>
            </div>
        )
    })

    const chipClick = (e) => {
        // e.preventDefault()
        if(!Dragable){
            console.log("????????????!")
            return;
        }
        console.log('chip click')
        
        let chip = {
            id: `${e.timeStamp}`,
            terminalX:tableRef.current.offsetLeft + 80,
            terminalY:tableRef.current.offsetTop + 80,
            originX:e.pageX,
            originY:e.pageY
        };
        setClickChip(chip)
        chipRef.current.init(chip)
        
    }


    const FixedChip = () => {
        return (
            <div className='chip'>
                fix
            </div>
        )
    }
  
    const NackChalClick = () => {
        /*??????????????? ??????, Bet??? ?????? ??????????????? ??? chip ??????, ????????? ?????????.
        */
        Chips.splice(myIndex, 1, Chips[myIndex] + Bet);
        setBet(0)
        setChips(Chips)
        if(Chips[myIndex]>0){
            setDragable(true)
        }
        setCurTurn(myIndex)
        Socket.emit('turnInfo', {Chips: Chips, Bet: 0, curTurn: myIndex}, roomInfo)
        //?????? ????????? ????????????
        playerBids[myIndex].push(curBid)
        //array ??????
        playerBids[myIndex].sort(function(a,b) {
            return b-a;
        })
        var tempBidStatus =DFA_Bids(playerBids[myIndex])
        //console.log("tempmyBids", playerBids[myIndex])
        console.log("??????????????????", tempBidStatus)
        playerBids.splice(myIndex, 1, playerBids[myIndex])
        BidStatus.splice(myIndex, 1 , tempBidStatus)
        var tempItems = Items
        var nackchalItem = tempItems.pop()
        setCurBid(nackchalItem)
        //setItems(tempItems)
        
        Socket.emit('nackchal', {playerBids: playerBids, curBid: nackchalItem, Items: tempItems, BidStatus: BidStatus}, roomInfo)

    }

    const DFA_Bids = (arr) => {
        //var arr = [-1,-3,-4,-5,-7,-9,-10, -12,-13,-14]
        var activeIndex = [];
        var inSequence = false;
        var i = 0;
        var result = 0;
        var prev = 1;
        while(i < arr.length){
            inSequence = ((prev - arr[i])==1); // ????????? ???????????? ??????
            if(inSequence == false){
                result += arr[i]
                activeIndex.push(i);
            }
            prev = arr[i]
            i++
        }
        console.log("DFA result",result, activeIndex)
        return {totalBids: result, activeIndex: activeIndex}
    }

    const whoIsWinner = () => {
        var scores = BidStatus.map((status, index) => (Chips[index] + status.totalBids))
        console.log("totalscore", scores)
        return scores
    }
    // const whoIsWinner

    const Table = () => {
        return (
          <div class="chiptable" >
            {
                Playing ?
                    (curTurn == myIndex) ?
                    <div class="nackchalItem" onClick={NackChalClick}>
                        <span className={classes.square} >
                            {curBid}
                        </span>
                    </div> :
                    <div class="nackchalItem_notmyTurn">
                        <span className={classes.square} >
                            {curBid}
                        </span>
                    </div>
                : null
            }
            <br />  
          </div>
        );
      };

    // const handleClose = (event, reason) => {
    //     if (reason === 'clickaway') {
    //         return;
    //     }

    // setStartCondition(false);
    // setStartAlert(false);
    // };

    const [modalStyle] = React.useState(getModalStyle);
    const [open, setOpen] = React.useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setStartCondition(false);
    };

    const handleClosealert = () => {
        setStartAlert(false);
    };
    const handleCloseresult = () => {
        setResult(false);
    };
    const handleCloseForce = () => {
        setForce(false);
    };

    
  return (
    <Canvas>
        <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
          />

        <Html as='div' fullscreen="true" >
            <div class="mainbox">
                <div class="leftbox">
                    {waiting.map((index) =>
                    index % 2 == 0 ? (
                        Players[index] != null ? 
                        (
                            (index != curTurn) ?
                                (Players[index]?._id == playerId) ?
                                <div class="rocket-left" >
                                    <div class={"rocket-body"} id="notmyTurn">
                                        <div class="body">
                                            <div class='playerNameLeftMy'>{Players[index].name}</div>
                                            <Oppo_player 
                                                player={Players[index]} host= {host} playerBids={playerBids}
                                                    BidStatus={BidStatus} Playing={Playing}
                                                    Index = {index} myIndex = {myIndex}
                                            />
                                        </div>
                                        <div class="fin fin-left"></div>
                                        <div class="fin fin-right"></div>
                                        <div class="window">{Chips[myIndex]}</div>
                                    </div>
                                </div>
                                :
                                <div class="rocket-left" >
                                    <div class={"rocket-body"} id="notmyTurn">
                                        <div class="body">
                                            <div class='playerNameLeft'>{Players[index].name}</div>
                                            <Oppo_player 
                                                player={Players[index]} host= {host} playerBids={playerBids}
                                                    BidStatus={BidStatus} Playing={Playing}
                                                    Index = {index} myIndex = {myIndex}
                                            />
                                        </div>
                                        <div class="fin fin-left"></div>
                                        <div class="fin fin-right"></div>
                                        <div class="window"></div>
                                    </div>
                                </div>
                                    
                            
                            // <div class={"opo-player-left"} id="notmyTurn">
                                // {/* <Oppo_player 
                                //     player={Players[index]} host= {host} playerBids={playerBids}
                                //         BidStatus={BidStatus} Playing={Playing}
                                //         Index = {index} myIndex = {myIndex}
                                // />
                                // {
                                //     (Players[index]?._id == playerId)
                                //         ? <div>
                                //             {Playing ? Chips[myIndex] : null}
                                //             {Playing && (curTurn==myIndex)
                                //                 ? Dragable ? <Chip  />: <FixedChip />
                                //                 : null}
                                //         </div>
                                //         : null
                                // } */}
                            // </div> 
                            : (Players[index]?._id == playerId)
                                ? <div class="rocket-left" >
                                    <div class={"rocket-body"} id="myTurn">
                                        <div class="body">
                                            <div class='playerNameLeftMy' >{Players[index].name}</div>
                                            <Oppo_player 
                                                player={Players[index]} host= {host} playerBids={playerBids}
                                                    BidStatus={BidStatus} Playing={Playing}
                                                    Index = {index} myIndex = {myIndex}
                                            />
                                        </div>
                                        <div class="fin fin-left"></div>
                                        <div class="fin fin-right"></div>
                                        <div class="window" onClick={chipClick}>
                                            <div class='shootLeft'>
                                                <Chip ref={chipRef} />
                                            </div>
                                            {Chips[myIndex]}
                                        </div>
                                    </div>
                                    
                                </div>
                                : <div class="rocket-left" >
                                    <div class={"rocket-body"} id="myTurn">
                                        <div class="body">
                                            <div class='playerNameLeft'>{Players[index].name}</div>
                                            <Oppo_player 
                                                player={Players[index]} host= {host} playerBids={playerBids}
                                                    BidStatus={BidStatus} Playing={Playing}
                                                    Index = {index} myIndex = {myIndex}
                                            />
                                        </div>
                                        <div class="fin fin-left"></div>
                                        <div class="fin fin-right"></div>
                                        <div class="window"></div>
                                    </div>
                                </div>
                                
                            // <div class={"opo-player-left"} id="myTurn">
                            //     {/* <Oppo_player 
                            //         player={Players[index]} host= {host} playerBids={playerBids}
                            //             BidStatus={BidStatus} Playing={Playing}
                            //             Index = {index} myIndex = {myIndex}
                            //     />
                            //     {
                            //         (Players[index]?._id == playerId)
                            //             ? <div class="myChips">
                            //                 {Playing ? <span class="myChipsNum">{Chips[myIndex]}</span> : null}
                            //                 {Playing && (curTurn==myIndex)
                            //                     ? Dragable ? <span class="ChipForBet"><Chip /></span> :<span class="ChipForBet"><FixedChip /></span>
                            //                     : null}
                            //             </div>
                            //             : null
                            //     } */}
                            // </div>
                        ) : 
                        (
                            <div class="rocket-left" >
                                <div class="rocket-body" id="nowon">
                                    <div class="body"></div>
                                    <div class="fin fin-left"></div>
                                    <div class="fin fin-right"></div>
                                    <div class="window"></div>
                                </div>
                            </div>
                        )
                    ) : null
                    )}
                </div>
        
                <div class="space">
                    <Table/>
                    <div class="moon" ref={tableRef}>
                        <div class="crater"></div>
                        <div class="crater"></div>
                        <div class="crater"></div>
                        
                        <div class="moonlight-perspective">
                    <span class="moonlight"></span>
                    </div>
                    <div class="moon2" > 
                    <span className="chipBox" >{Bet}</span>
                    </div>
                </div>
                <div class="orbit">
                    <div class="rocket"></div>
                </div>
                    
                    
                    {
                        Playing ? 
                            (33-Items.length)!=32 ?
                                <div class="Round"> {"Round: " + (33-Items.length)} </div> :
                                <div class="Round"> Final Round </div>
                        : 
                            (host?._id == playerId) ?
                            <text class="startBtn" onClick={startClick}>Press to Start</text> :
                            null
                    }
                    
                    <a href='/scroll' class="exitBtn"  style={{ textDecorationLine : 'none'}}>
                    <text class="exitBtntext">Exit</text>
                    </a>
                </div>
        
                <div class="rightbox">
                {waiting.map((index) =>
                    index % 2 == 1 ? (
                        Players[index] != null ? 
                        (
                            (index != curTurn) ?
                            (Players[index]?._id == playerId) ?
                            <div class="rocket-right" >
                                <div class={"rocket-body"} id="notmyTurn">
                                    <div class="body">
                                    <div class='playerNameRightMy'>{Players[index].name}</div>
                                        <Oppo_player 
                                            player={Players[index]} host= {host} playerBids={playerBids}
                                                BidStatus={BidStatus} Playing={Playing}
                                                Index = {index} myIndex = {myIndex}
                                        />
                                    </div>
                                    <div class="fin fin-left"></div>
                                    <div class="fin fin-right"></div>
                                    <div class="window">{Chips[myIndex]}</div>
                                </div>
                            </div>
                            :
                            <div class="rocket-right" >
                                <div class={"rocket-body"} id="notmyTurn">
                                    <div class="body">
                                        <div class='playerNameRight'>{Players[index].name}</div>
                                        <Oppo_player 
                                            player={Players[index]} host= {host} playerBids={playerBids}
                                                BidStatus={BidStatus} Playing={Playing}
                                                Index = {index} myIndex = {myIndex}
                                        />
                                    </div>
                                    <div class="fin fin-left"></div>
                                    <div class="fin fin-right"></div>
                                    <div class="window"></div>
                                </div>
                            </div>
                                
                            
                            // <div class={"opo-player-left"} id="notmyTurn">
                                // {/* <Oppo_player 
                                //     player={Players[index]} host= {host} playerBids={playerBids}
                                //         BidStatus={BidStatus} Playing={Playing}
                                //         Index = {index} myIndex = {myIndex}
                                // />
                                // {
                                //     (Players[index]?._id == playerId)
                                //         ? <div>
                                //             {Playing ? Chips[myIndex] : null}
                                //             {Playing && (curTurn==myIndex)
                                //                 ? Dragable ? <Chip  />: <FixedChip />
                                //                 : null}
                                //         </div>
                                //         : null
                                // } */}
                            // </div> 
                            : (Players[index]?._id == playerId)
                            ? <div class="rocket-right" >
                                <div class={"rocket-body"} id="myTurn" >
                                    <div class="body">
                                        <div class='playerNameRightMy'>{Players[index].name}</div>
                                        <Oppo_player 
                                            player={Players[index]} host= {host} playerBids={playerBids}
                                                BidStatus={BidStatus} Playing={Playing}
                                                Index = {index} myIndex = {myIndex}
                                        />
                                    </div>
                                    <div class="fin fin-left"></div>
                                    <div class="fin fin-right"></div>
                                    <div class="window" onClick={chipClick}>
                                        <div class='shootRight'>
                                            <Chip ref={chipRef} />
                                        </div>
                                        {Chips[myIndex]}
                                    </div>
                                </div>
                                
                            </div>
                            : <div class="rocket-right" >
                                <div class={"rocket-body"} id="myTurn">
                                    <div class="body">
                                        <div class='playerNameRight'>{Players[index].name}</div>
                                        <Oppo_player 
                                            player={Players[index]} host= {host} playerBids={playerBids}
                                                BidStatus={BidStatus} Playing={Playing}
                                                Index = {index} myIndex = {myIndex}
                                        />
                                    </div>
                                    <div class="fin fin-left"></div>
                                    <div class="fin fin-right"></div>
                                    <div class="window"></div>
                                </div>
                            </div>
                            
                            // <div class={"opo-player-left"} id="myTurn">
                            //     {/* <Oppo_player 
                            //         player={Players[index]} host= {host} playerBids={playerBids}
                            //             BidStatus={BidStatus} Playing={Playing}
                            //             Index = {index} myIndex = {myIndex}
                            //     />
                            //     {
                            //         (Players[index]?._id == playerId)
                            //             ? <div class="myChips">
                            //                 {Playing ? <span class="myChipsNum">{Chips[myIndex]}</span> : null}
                            //                 {Playing && (curTurn==myIndex)
                            //                     ? Dragable ? <span class="ChipForBet"><Chip /></span> :<span class="ChipForBet"><FixedChip /></span>
                            //                     : null}
                            //             </div>
                            //             : null
                            //     } */}
                            // </div>
                        ) : 
                        (
                            <div class="rocket-right" >
                                <div class="rocket-body" id="nowon">
                                    <div class="body"></div>
                                    <div class="fin fin-left"></div>
                                    <div class="fin fin-right"></div>
                                    <div class="window"></div>
                                </div>
                            </div>
                        )
                    ) : null
                    )}
                </div>
                
                {/* <Snackbar open={startAlert} autoHideDuration={8000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="info" >
                    <div class="instruction">
                        ????????????!
                        <br/>
                        ?????? ????????? ????????? ?????? ????????? ????????? ????????? ??? ????????????.
                        <br/>
                        ????????? ?????? ?????? ?????? ????????? ?????? ???????????? ???????????? ?????? ???????????????.
                        <br/>
                        ??? -3?????? -35????????? ?????? ????????? ?????????, ??? ?????? ?????? ????????? ????????? ????????? ????????? ????????????
                        <br/>
                        ???????????? ????????? ?????? ??? ?????? ???????????? ??? ?????? ????????? ????????? ??????, ????????? ?????? ?????? ????????? ???????????????
                        <br/>
                        ????????? ????????? ???????????? ?????? ??????, ???????????? ?????? ????????? ????????? ???????????????
                        <br/> 
                        (ex. -12,-13, -14??? ????????? ?????? ??? -13??? -14??? ???????????? ????????????)
                    </div>
                    
                </Alert>
                </Snackbar> */}

                {
                    startCondition ?
                    <div
                        aria-labelledby="simple-modal-title"
                        aria-describedby="simple-modal-description"
                        z
                        >
                        <div onClick={handleClose} style={modalStyle} className={classes.paper}>
                        <h2 class="caution"> CAUTION ?????? </h2>
                        <p class="modaltext">
                        ??????????????? ??? ??? ????????? ??? ????????? ????????? ??? ????????????.
                        </p>
                        </div>
                        </div>
                        : null
                }

                {
                    startAlert ?
                    <div
                        aria-labelledby="simple-modal-title"
                        aria-describedby="simple-modal-description"
                        z
                        >
                        <div onClick={handleClosealert} style={modalStyle} className={classes.paper}>
                        <h2 class="caution"> Game Start ???? </h2>
                        <p class="modaltext">
                        1. ?????? ????????? ????????? ?????? ????????? ????????? ????????? ??? ????????????.
                        <br/><br/>
                        2. ????????? ?????? ?????? ?????? ????????? ?????? ???????????? ???????????? ?????? ???????????????.
                        <br/><br/>
                        3. ??? -3?????? -35????????? ?????? ????????? ?????????, ??? ?????? ?????? ????????? ????????? ????????? ????????? ????????????.
                        <br/><br/>
                        4. ???????????? ????????? ?????? ??? ?????? ???????????? ??? ?????? ????????? ????????? ??????, ????????? ?????? ?????? ????????? ???????????????.
                        <br/><br/>
                        5. ????????? ????????? ???????????? ?????? ??????, ???????????? ?????? ????????? ????????? ???????????????.
                        (ex. -12,-13, -14??? ????????? ?????? ??? -13??? -14??? ???????????? ????????????)
                        </p>
                        </div>
                        </div>
                        : null
                }

                {
                    isResult ?
                    <div
                        aria-labelledby="simple-modal-title"
                        aria-describedby="simple-modal-description"
                        z
                        >
                        <div onClick={handleCloseresult} style={modalStyle} className={classes.paper}>
                        <h2 class="caution"> Game Finish ???? </h2>
                        <p class="modaltext">
                         { Result2.map((one, i) => 
                            <div>
                             <span className="resultPrize"> {i+1 + Grade[i]} </span>
                             <span className="resultContent" > {  one.username +" : "+ one.score }
                              { i+1==Players.length ? null : <div><br/></div> }
                             </span> </div>
                          ) }
                        </p>
                        </div>
                        </div>
                        : null
                }

                {
                    Force ?
                    <div
                        aria-labelledby="simple-modal-title"
                        aria-describedby="simple-modal-description"
                        z
                        >
                        <div onClick={handleCloseForce} style={modalStyle} className={classes.paper}>
                        <h2 class="caution"> CAUTION ?????? </h2>
                        <p class="modaltext">
                        ?????? ???????????? ????????? ????????? ?????????.
                        </p>
                        </div>
                        </div>
                        : null
                }               

                
                
            </div>

                
            {/* <Snackbar open={startCondition} autoHideDuration={3000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="warning">
                    ??????????????? ??? ??? ????????? ??? ????????? ????????? ??? ????????????
                </Alert>
            </Snackbar> */}
        </Html>  
    </Canvas>
    
  );
}
export default withRouter(MG_GamePage);

