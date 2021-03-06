/**
 * Created by shijiangang on 2018/6/12.
 */


const tools = require('./../app/tools')
const redis = require("redis");
const redisconfig = require('./../config/redisconfig')
client = redis.createClient(redisconfig.port,redisconfig.host);
const DBService =require('./../service/db_service');

var apihost='https://api.cryptocurpays.com:8080/api/v1/'

var appId=152
var userId = 11872
var appSecret = 'd3BnNyOvv1PrhbtluYe3WnG9ukvCNIcHLLMqw8XqrUqxHx5lc6gqSUCpxxE06C4GVAdNbR0OQgr2WprGUxyd8Iluhm9G77tLD5ndx04M7pdy2kdKImcm7vOEzkLxtKW09f8TOCZVd4cGXwXhLrMwkHe2tbaJNNrZQWtEoperxNc1XOfv6qdeFrmGEuf5s8Cf1l1HdrAS'


function detailsGet(req,res){
    var data ={}

    tools.sendhttppost("",data,function(err,data){

        this.res.render('profile.ejs', {user: user});
    }.bind({res:this.res}))

}


function useraddress(req,res){

    //return res.send('{"eth":{"address":"0x9ec7dbc417df21fd046a70431d774329ceebcebd","virtualRate":505.2672},"bch":{"address":"muzWUmm4biEQi4sKN4H9ssdsqeagxXc8Nr","virtualRate":893.3159999999999}}')
    getUserApiToken(req.user.playerid,function(tonken){
        var url = apihost+appId+"/users/"+req.user.playerid+"/address?token="+tonken
        //console.log(url)
        tools.sendhttpget(url,function(err,data){
            console.log(err)
            console.log(data)
            data = JSON.parse(data)
            res.send(data.data.addresses)
        })
    })
}


function getrates(req,res){
    //return res.send('{"eth":505.2672,"bch":893.3159999999999}')


    var fiatName = req.query.fiatName
    var url = apihost+"rates/" + fiatName
    //console.log(url)
    tools.sendhttpget(url, function (err, data) {
        console.log(err)
        console.log(data)
        data = JSON.parse(data)
        res.send(data.data)

    })
}

function pendingDeposits(req,res){
    //return res.send('{"eth":{"0x50753cdefd9d1cfb1ab004289b987ec01ef78c88136a0d98635693e911e835f4":{"from":"0x34b8fb244cee0630186ce59f5577c7cc3d8ce3f5","value":1,"confirmations":19,"need":20},"0xc5d95ca4e1fe3de8c63e37c5a81857fa5919c7abf09ad70b14261929fbca0bfa":{"from":"0x34b8fb244cee0630186ce59f5577c7cc3d8ce3f5","value":1,"confirmations":17,"need":20},"0xff9be4fb9b65e672b4e22d66ca8c3f1865da1dd5febb85611981249e13eebbbc":{"from":"0x34b8fb244cee0630186ce59f5577c7cc3d8ce3f5","value":1,"confirmations":17,"need":20}}}')


    getUserApiToken(req.user.playerid,function(tonken){
        var url = apihost+appId+"/users/"+req.user.playerid+"/pendingdeposits?token="+tonken
        //console.log(url)
        tools.sendhttpget(url,function(err,data){
            console.log(err)
            console.log(data)
            data = JSON.parse(data)
            res.send(data.data)
        })
    })


}

function withdraw(req,res){
    //return res.send('{"withdrawId":"20:11:36","withdrawLogId":1}')

    getUserApiToken(req.user.playerid,function(tonken){

        var d =new Date()

        var data = {
            toAddress:req.query.toaddress,
            withdrawId:d.valueOf(),
            appSecret:appSecret,
            cryptoValue:req.query.amount,
            appuserid:req.user.playerid
        }

        let postObj = {};
        postObj.orderid = data.withdrawId
        postObj.cryptotype = req.query.cryptoType
        postObj.cryptovalue = data.cryptoValue
        postObj.createtime = d.valueOf()
        postObj.playerid = data.appuserid



        DBService.addARecord("app_withdraw",postObj,function(err,d){

            console.log(err)
            console.log(d)

            var url = apihost+appId+"/tx/withdraw/"+req.query.cryptoType
            //console.log(url)
            tools.sendhttppost(url,this.data,function(err,data){
                console.log(err)
                console.log(data)
                data = JSON.parse(data)
                res.send(data)
            })
        }.bind({postObj,data}))



    })

}


function withdrawList(req,res){
    DBService.getWithdrawByPlayer(req.user.playerid,function(err,data){
        console.log(err)
        res.send(JSON.stringify(data))

    })
}


function depositList(req,res){
    DBService.getDepositByPlayerid(req.user.playerid,function(err,data){
        console.log(err)
        //console.log(data)
        res.send(JSON.stringify(data))

    })
}

function getUserApiToken(playerid,done){

    var url = apihost+appId+"/token/"+playerid+"?appsecret="+appSecret
    //console.log(url)
    tools.sendhttpget(url,function(err,data){
        console.log(err)
        console.log(data)
        data = JSON.parse(data)
        return done(data.data.Token)
    })

    //return done("9o3YxnWu0uVU59xeY3kPsNM2LL10mltRwNAM-UmM")
}



function postNewDeposit(req,res){
    var body = req.body
    //console.log(body)
    if(tools.isNullString(body)){
        return res.send("body fail")
    }

    if(tools.isNullString(body.txId)){
        return res.send("txId fail")
    }

    DBService.getDepositByTxid(body.txId,function(err,data){
        if(err){
            console.log(err)
            return res.send("txId fail")
        }

        if(data.length>0){
            return res.send("have data")
        }

        let postObj = {};
        postObj.appid = body.appId;
        postObj.playerid = body.userId;
        postObj.txid = body.txId;
        postObj.cryptoType = body.cryptoType;
        postObj.cryptoValue = body.cryptoValue;
        postObj.fiatCurrency = body.fiatCurrency;
        postObj.fiatRate = body.fiatRate;

        var virtualValue=1;//服务内和法币的汇率

        postObj.virtualValue = virtualValue*body.fiatRate*body.cryptoValue//根据法币和加密币的汇率,和加密币的数据,  算出 应该给玩家的真正数值
        postObj.createtime = body.timestamp;
        postObj.fromAddress = body.fromAddress;
        postObj.toAddress = body.toAddress;

        DBService.addARecord("app_deposits",postObj,function(err,data){
            if(err){
                console.log(err)
                return res.send("error")
            }

            DBService.updateAddCoinByPlayerid(this.postObj.virtualValue,this.postObj.playerid,function(err,data){

                console.log(err)
                //console.log(data)

                res.send("success")
            }.bind({postObj}))


        }.bind({postObj}))

    }.bind({body}))



}

function postWithdraw(req,res){
    var body = req.body
    //console.log(body)
    if(tools.isNullString(body)){
        return res.send("body fail")
    }

    if(tools.isNullString(body.orderid)){
        return res.send("txId fail")
    }

    DBService.getWithdrawByTxid(body.orderid,function(err,data){
        console.log(err)

        if(data.length <=0){
            return
        }

        if(data[0].statues==10){
            return res.send("success")
        }

        var tx = {}
        tx.txid=body.txHash
        tx.blocknumber =body.blockNumber
        tx.statues =10

        DBService.updateWithdrawByOrderId(data[0].orderid,tx,function(err,data){
            console.log(err)
            console.log(data)

            return res.send("success")
        })




    }.bind({body}))





}


module.exports={detailsGet,useraddress,getrates,pendingDeposits,withdraw,postNewDeposit,postWithdraw,withdrawList,depositList}

