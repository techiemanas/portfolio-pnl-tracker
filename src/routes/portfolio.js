const express = require("express");
const Portfolio = require("../models/portfolio");

const router = express.Router();


let portfolio = new Portfolio();

router.post('/trades', (req, res) => {
    try {
        const { symbol, side, price, quantity, timestamp } = req.body;

        if (!symbol || !side || !price || !quantity) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const trade = portfolio.addTrade({
            symbol,
            side,
            price,
            quantity,
            timestamp
        });
        res.status(201).json({
            success: true,
            message: 'Trade successful',
            data: trade
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/trades', (req, res)=>{
    try {
        const trades = portfolio.getAllTrades();
        res.json({
            success: true,
            count: trades.length,
            data: trades
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})


router.get('/portfolio', (req, res) => {
    try {
        const positions = portfolio.getPositions();
        const summary = {
            totalValue: Object.values(positions).reduce((sum, pos)=> sum+pos.currentValue, 0),
            totalCost: Object.values(positions).reduce((sum, pos) => sum + pos.totalCost, 0),
            numberOfPositions: Object.keys(positions).length
        };
        res.json({
            success: true,
            summary,
            positions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


router.get('/pnl', (req, res)=> {
    try {
        const pnl = portfolio.getPnL();
        res.json({
            success: true,
            data: pnl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
})

module.exports = router;
