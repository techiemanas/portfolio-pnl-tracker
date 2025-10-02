const express = require("express");
const cors = require("cors");
const portfolioRoutes = require("./routes/portfolio");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

app.use('/api', portfolioRoutes)


app.get('/health', (req, res)=> {
    res.json({status: 'OK', timestamp: new Date().toISOString()})
})


if(process.env.NODE_ENV !== 'test'){
    app.listen(PORT, () => {
        console.info(`Portfolio pnl tracker service running on prt ${PORT}`);
    })
}