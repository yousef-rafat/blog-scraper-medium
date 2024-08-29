const PORT = 3000;

const cheerio = require('cheerio');
const axios = require('axios');
const express = require('express');
const puppeteer = require('puppeteer');

const prompt = require("prompt-sync")();

let account = prompt("Account: https://www.medium.com/@")
let keyword = prompt("Keyword: ")

const app = express();

app.get('/', (req, res) => {
    res.json("Welcome to my AI Blog scraping.");
});

async function scrapeBlogs(website, keyword) {
    try {
        const base = "https://medium.com";
        const web = base + '/' + website;

        const response = await axios.get(web);
        const html = response.data;
        const $ = cheerio.load(html);

        const browser = await puppeteer.launch({ headless: true });
        const blogs = [];

        const links = $(`a:contains("${keyword}")`, html).map((i, el) => {
            return {
                title: $(el).text().trim(),
                href: $(el).attr('href')
            };
        }).get();

        for (const link of links) {
            const page = await browser.newPage();
            if ((base + link.href).includes("https://medium.comhttps://medium.com")) {
                continue;
            }

            await page.goto(base + link.href, { waitUntil: 'networkidle2' });

            const newResponse = await axios.get(base + link.href);
            const newHTML = newResponse.data;
            const $$ = cheerio.load(newHTML);
            const texts = [];

            $$('p', newHTML).each((i, el) => {
                texts.push($$(el).text().trim());
            });

            const filteredText = texts.slice(10, texts.length - 13);

            blogs.push({
                title: link.title,
                href: base + link.href,
                filteredText
            });

            await page.close();
        }

        await browser.close();
        return blogs;

    } catch (err) {
        console.error(err);
        throw new Error('An error occurred while fetching blogs.');
    }
}

app.get('/', (req, res) => {
    res.json("Welcome to my AI Blog scraping.");
});

app.get('/blogs', async (req, res) => {
    try {
        const blogs = await scrapeBlogs(`/@` + account, keyword);
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Running on Server ${PORT}`);
});