# Knowledge Base for a Halal Crypto Purchase Advisor

## Use and non-fatwa notice

This document is a conservative operating KB for an AI agent that advises a retail investor on purchasing cryptoassets under strict Halal constraints.

This KB covers spot purchase decisions only.

This KB does not authorize leverage, margin, short selling, futures, perpetuals, options, borrowing to buy crypto, lending crypto for yield, or "earn" products.

This KB is a screening and risk-control framework, not a personal fatwa.

Crypto Halal status is still unsettled.

The agent must say that clearly in every recommendation.

The agent must tell the user to verify the conclusion with a qualified scholar they trust before acting.

When a token is both financially risky and Shariah-debatable, the default action is WAIT or AVOID.

When live market data matters, the agent must refresh it immediately before answering.

That includes market-cap rank, price, support levels, ETF flow context, BTC dominance, and stablecoin-supply context.

The agent should prefer clarity, ownership, real utility, and low structural ambiguity over chasing upside.

The agent should prefer under-inclusion to over-inclusion.

If the agent is unsure, it should not stretch to make a token Halal.

It should downgrade the recommendation instead.

## Halal compliance analysis

1. HALAL CRYPTO COMPLIANCE -- DEEP DIVE

1.1. Why crypto compliance is unsettled.

Crypto compliance is unsettled because there is no single globally binding Shariah authority for cryptoassets, no universally adopted legal classification for all tokens, and no dedicated cryptocurrency standard publicly listed by entity["organization","AAOIFI","bahrain standards body"] as of May 2026. Publicly available AAOIFI materials show active discussion of cryptocurrencies in conferences and calls for papers, but the live Shari'ah standards catalog does not show a dedicated crypto standard. citeturn18view0turn19view0turn20view0turn20view1

The dispute is not only about "crypto" in the abstract.

It is also about what the token actually is.

A token may act like money, a network-use right, a software-service token, a governance right, a claim on reserves, a wrapped exposure, or a yield-bearing instrument.

Different fiqh outcomes follow from those different legal and economic realities. citeturn15view0turn11view0turn42view1

The ruling can also change with use.

Spot ownership, staking, lending, borrowing, collateralization, and exchange custody are not the same act.

A scholar may be more open to owning BTC spot than to staking ETH through a centralized exchange, and more open to holding a utility token than to holding a governance token tied to an interest-based lending protocol. citeturn11view0turn12search6turn33view0

National-level rulings also differ.

Some fatwa bodies are broadly restrictive.

Some individual scholars are broadly permissive but case-by-case.

Some permit crypto as mal, meaning property or wealth, while refusing to call it full-fledged money.

That is why the agent must never imply that "Islam has already settled crypto." It has not. citeturn42view0turn42view1turn15view0turn11view0

1.2. Major scholarly and institutional positions.

The modern case-by-case screening framework associated with entity["people","Mufti Faraz Adam","shariah advisor"] of entity["organization","Amanah Advisors","shariah advisory firm"] is one of the most useful working models for an AI agent.

His later writing does not treat all cryptoassets alike.

He says many cryptoassets can be digital assets, and that lawful utility can be enough for a token to count as mal from a Shariah perspective.

He also argues that screening is essential and should include legitimacy screening, project screening, financial screening for equity-like tokens, token screening, and staking screening.

He repeatedly warns against junk coins, meme tokens, manipulation, and protocols whose reward design may create gambling-like outcomes. citeturn15view0turn16view0turn16view1turn16view2turn33view0

The framework associated with entity["people","Joe Bradford","shariah advisor"] starts from the classical principle that the base ruling of things is permissibility unless there is evidence to prohibit them.

In practice, he proposes five filters for a crypto coin: it should function as a store of value, function as a medium of exchange, offer transparency about recourse, avoid ponzi-like tokenomics, and have an established or at least projected lawful real-world use case.

On staking, he explicitly distinguishes between impermissible interest-like or ponzi-like arrangements and permissible participation in validation work where rewards are contingent on actual network contribution rather than guaranteed capital return. citeturn12search0turn12search4turn12search6

The more restrictive line associated with entity["people","Haitham al-Haddad","islamic scholar"] has argued that many cryptocurrencies do not yet satisfy the controls needed to function as valid currency or tradable commodity and that the unresolved uncertainty and instability remain serious concerns.

At the same time, material published in the orbit of the entity["organization","Islamic Council of Europe","uk religious council"], especially extended teaching by Shaykh Sajid Umar, maps multiple scholarly views rather than one blanket rule.

That material is more nuanced: it says crypto can be assessed as wealth rather than currency, warns against premature blanket permissions, and says staking must be judged by the actual mechanics and revenue source of the platform. citeturn8search4turn11view0turn10search1

AAOIFI is important because many Muslims look to it for standard-setting leadership.

But for crypto, the practical takeaway is not "AAOIFI has approved crypto."

The practical takeaway is that AAOIFI has not publicly published a dedicated crypto standard in its live standards catalog, while separately treating cryptocurrencies as an emerging field worthy of conferences, working papers, and journal submissions. The agent must therefore not cite AAOIFI as if it had already settled the issue. citeturn18view0turn19view0turn20view0turn20view1

The position of entity["organization","Majelis Ulama Indonesia","indonesia ulama council"] is restrictive but not identical to a total conceptual ban.

Its published 2021 decision says cryptocurrency as currency is haram because of gharar and dharar and conflict with Indonesian law.

It also says cryptocurrency as digital commodity or asset is not valid for trade when it contains gharar, dharar, qimar and fails the Shariah conditions of sil'ah.

But the same decision leaves room for tradability where the cryptoasset meets the conditions of a lawful asset, has underlying basis, and has clear benefit. citeturn42view1

The position of the Turkish Diyanet, formally the entity["organization","Presidency of Religious Affairs","turkiye state religious body"] High Board of Religious Affairs, is also restrictive.

Its official fatwa says money that is widely accepted and whose source gives confidence to users can be used.

It then says cryptocurrencies with serious internal uncertainty, high deception risk, lack of guarantee, and patterns of unjust enrichment are not permissible. citeturn42view0

The Egyptian line associated with entity["organization","Dar al-Ifta al-Misriyyah","egypt fatwa authority"] has also been restrictive.

Official Egyptian material later referred back to the 2017 Bitcoin fatwa as one of the examples of public-interest economic guidance, and Reuters reported that Egypt's Grand Mufti warned of fraud, ignorance, volatility, and harm around Bitcoin trading when that fatwa was issued. citeturn43search2turn4search0

1.3. Common compliance criteria the agent should apply.

A strict agent should screen crypto through a narrow common denominator that appears repeatedly in permissive and restrictive discussions.

The first criterion is lawful utility.

If a token does not do anything lawful, represent anything lawful, grant access to anything lawful, or facilitate any lawful network function, it is much harder to defend as valid mal.

This utility test is central in both Faraz Adam's work and Joe Bradford's framework. citeturn15view0turn16view0turn16view1turn12search4

The second criterion is intelligible economic substance.

The buyer should be able to explain, in plain language, what the token is for, who uses it, what right or function it gives, and how that function is not inherently sinful.

If that cannot be explained, the asset is likely too close to jahalah and speculative vapor. citeturn16view1turn42view0turn42view1

The third criterion is absence of riba exposure in the token's own design.

If the token or protocol is directly built around lending at interest, paying deposit interest, borrow-rate extraction, or interest-bearing reserve design, the strict profile should downgrade or exclude it.

This is the main reason lending-protocol governance tokens are problematic, and it is one of the main reasons fiat stablecoins remain debated. citeturn23search2turn23search10turn24search0turn36view2turn36view3turn38search0turn38search2

The fourth criterion is disciplined treatment of gharar.

Not all risk is forbidden.

Trade involves risk.

What matters is whether the structure contains major unresolved ambiguity in subject matter, issuance, recourse, supply, governance, custody, or economic reality.

That concern is explicit in MUI, Diyanet, and the restrictive scholarly view. citeturn42view1turn42view0turn8search4

The fifth criterion is excluding maysir and qimar-like structures.

If token demand is mainly driven by hype, lottery-like payoff expectations, casino behavior, or early-holder extraction from later entrants, the agent should treat the structure as presumptively non-compliant.

That principle is visible in discussions of meme coins, manipulative tokenomics, and gambling-adjacent protocols. citeturn16view0turn16view1turn16view2turn12search4

The sixth criterion is real-world use case.

The use case does not need to be offline.

It can be onchain.

But it must still be real.

Examples include paying network fees, securing consensus, supplying oracle data, or enabling verifiable settlement.

The agent must distinguish between "people are trading it" and "people are using it."

Those are not the same thing. citeturn15view0turn16view1turn23search0turn21search21

The seventh criterion is structural fairness.

Faraz Adam's blockchain analysis is useful here.

He says Shariah review should examine what a protocol validates, how fees are charged, how rewards are distributed, and whether the design disadvantages one party unfairly or creates a gambling scenario.

That means tokenomics are part of the fiqh analysis, not just the marketing story. citeturn33view0

1.4. Why meme coins and gambling-platform tokens are widely flagged haram.

The cleanest strict-profile argument against meme coins is not only that they are silly.

It is that many of them fail the utility test, fail the substance test, and are marketed through hype cycles that reward early entrants at the expense of late entrants.

Faraz Adam's commentary on meme tokens and crypto junk is direct on this point: assets need bona fide lawful utility, and many so-called payment or currency tokens do not function as such in reality. citeturn16view0turn16view1turn16view2

Joe Bradford's anti-ponzi filter reaches the same result from a different angle.

If the coin is sold mainly through upward-number promises, referral logic, or reward design that depends on later buyers subsidizing earlier holders, then the tokenomics are not merely risky; they are structurally suspect from a Shariah perspective. citeturn12search4turn12search6

Gambling-platform tokens are even easier to exclude.

The underlying business is betting, chance-based gain, or casino-style activity.

For a strict Halal purchase advisor, any token whose primary demand driver is casino, prediction-market gambling, sports betting, or similar zero-sum wagering activity should be excluded without further portfolio analysis. This is a house rule consistent with the broader fiqh concern about qimar and unjust enrichment. citeturn42view1turn42view0turn16view1

1.5. Why interest-bearing DeFi tokens are flagged.

The strict-profile problem with lending-protocol governance tokens is straightforward.

entity["organization","Aave","defi lending protocol"] describes itself as a decentralized non-custodial liquidity protocol where suppliers earn interest and borrowers pay variable interest.

Its documentation explains that supply rates are derived from borrower interest and protocol fees. citeturn23search2turn23search10turn23search12turn23search14

entity["organization","Compound","defi lending protocol"] is even more explicit.

Its official docs say users with positive balances earn interest, users with negative balances pay interest, and governance can set interest-rate models. citeturn24search0turn24search12turn24search16

For a strict Halal screen, ownership of governance tokens tied to protocols whose core business is interest-bearing lending is too close to direct participation in an interest economy.

That is why AAVE and COMP should ordinarily be treated as avoid. citeturn23search2turn24search0

The case of entity["organization","Uniswap","dex protocol"] and UNI is weaker on pure riba grounds because Uniswap is primarily an automated market maker and governance protocol rather than a lending market.

However, a strict-conservative agent should still treat UNI as at least cautionary because it is a speculative governance token in permissionless DeFi rather than a plainly useful payment or settlement asset, and because its value case is indirect and governance-based rather than simple network necessity. The agent should therefore not place UNI alongside BTC or LINK in any strict-profile shortlist. citeturn23search1turn23search7turn15view0turn12search4

1.6. Stablecoin debate.

The stablecoin debate is not about price stability alone.

It is about reserve structure.

entity["company","Circle","usdc issuer"] says USDC is backed by highly liquid cash and cash-equivalent assets, that the majority of the reserve is invested in the Circle Reserve Fund, and that the reserve portfolio can contain short-dated U.S. Treasuries and overnight Treasury repos managed by entity["company","BlackRock","asset manager"]. Circle's own reporting says the reserve is roughly 90 percent short-duration Treasuries and overnight repos and the rest cash. citeturn36view1turn36view2turn36view3

entity["company","Tether","stablecoin issuer"] similarly says Tether tokens are backed by reserves, publishes quarterly reserve information, and in recent official updates has described USDT reserves as Treasury-heavy, including direct and indirect Treasury exposure and short-duration high-quality liquid instruments. citeturn37search0turn38search0turn38search2

For a strict Shariah buyer, the problem is not that the holder is collecting Treasury interest directly.

The problem is that the issuer's reserve architecture and earnings model are materially linked to interest-bearing instruments.

That keeps USDC and USDT in a debated category under strict Halal screening.

The most conservative house rule is this: stablecoins may be tolerated as temporary transaction rails for entering or exiting spot crypto, but they should not be presented as long-term "buy" ideas for Halal investment conviction. citeturn36view2turn36view3turn38search0turn38search2

1.7. Staking debate.

Staking is not one thing.

That is why AI agents make mistakes when they treat all staking as either Halal or haram.

Joe Bradford's three-part distinction is operationally useful.

If the arrangement is just a cash-on-cash loan with a quoted return, it is haram.

If rewards come mainly from coins of new entrants, it is ponzi-like and haram.

If the staked asset is actually used in validation and network security, and rewards are contingent on performance and protocol rules rather than guaranteed capital premium, he treats that as potentially Halal. citeturn12search6

Faraz Adam's blockchain analysis supports a similar case-by-case method.

He says the review should examine what the protocol validates, how rewards are distributed, and whether the design creates a gambling scenario or unfair process. citeturn33view0

The Islamic Council of Europe educational material around Sajid Umar adds another practical screening rule: if the staking return is tied to a platform whose functions include spreads, short selling, derivatives, or other questionable revenue engines, then the ruling follows those mechanics, not the word "staking" on the label. citeturn11view0

For the agent, the strict house rule is:

Native validation or native delegation may be conditionally acceptable, but exchange "earn" products, pooled custodial staking, fixed APY advertisements, or any capital-protected staking wrapper should be treated as non-compliant until independently reviewed.

## Asset screening and tiering

2. COIN-BY-COIN HALAL STATUS

2.1. BTC.

Working status: the strongest large-cap Halal case.

Dominant view among crypto-permissive scholars: generally accepted or at least the most defensible.

Reasoning: BTC has the clearest claim to decentralized digital scarcity, broad social acceptance, long operating history, global liquidity, and actual use as peer-to-peer digital cash and store-of-value infrastructure.

It also avoids the direct interest-engine problem seen in DeFi lenders and does not depend on centralized corporate reserves like fiat stablecoins. citeturn26search1turn26search5turn15view0turn12search0turn12search4

Key concerns: volatility, speculative use by many market participants, and the fact that some national fatwa bodies remain generally restrictive on crypto as a class.

These concerns should lower certainty language, but they do not displace BTC from the top of a strict-profile shortlist. citeturn42view0turn42view1turn4search0

Agent conclusion: BTC is the default first idea in discover mode unless the user already has meaningful BTC exposure or explicitly refuses it.

2.2. ETH.

Working status: conditional and debated.

Dominant view: more debated than BTC.

Reasoning in favor: ETH is not just a speculative chip.

The Ethereum network uses ETH for gas, settlement, and security.

Official Ethereum docs say validators stake ETH to secure the network, process transactions, and add blocks.

That gives ETH a clear onchain utility case. citeturn21search3turn21search21turn21search24

Core concern: proof-of-stake and staking yield.

Because ETH is now secured by proof-of-stake, the investor must distinguish between holding spot ETH, self-validating, delegated staking, liquid-staking wrappers, and custodial staking offers.

The stricter the profile, the easier it is to defend spot ETH without staking than yield-seeking ETH via a platform. citeturn21search0turn21search3turn12search6turn11view0turn33view0

Agent conclusion: ETH can appear in discover mode, but only with explicit staking caveats.

Preferred wording is "conditional Halal status; stronger if purchased spot and not placed into questionable yield programs."

2.3. SOL.

Working status: conditional and debated.

Reasoning in favor: Solana has genuine network utility and proof-of-stake based validation.

Its documentation ties delegation and validator economics to participation in the active network economy and reward distribution. citeturn21search1turn21search22turn21search10

Key concerns: the same staking problem as ETH, plus higher protocol and governance risk, plus the fact that official Solana material itself describes delegated holders as earning rates proportional to validator economics.

For strict Halal screening, the agent should assume that spot-only ownership is easier to defend than staking-based ownership. citeturn21search1turn33view0turn12search6

Agent conclusion: not a default recommendation for a strict beginner.

At most, it is a second-tier conditional candidate after BTC and possibly ETH.

2.4. ADA.

Working status: conditional and debated.

Reasoning in favor: Cardano has clear proof-of-stake architecture, transaction-fee utility, governance utility, and official documentation built around delegation and pool operation.

The network explicitly says ADA holders can delegate or run pools and receive monetary rewards. citeturn21search5turn21search8turn21search14turn21search17

Key concerns: the same staking debate, plus the market reality that many buyers hold ADA mainly for speculative appreciation rather than direct network use.

That does not automatically make it haram, but it lowers confidence compared with BTC. citeturn12search6turn33view0

Agent conclusion: conditional candidate only.

Do not surface ADA before BTC.

Do not surface it without staking caveats.

2.5. AVAX.

Working status: conditional and debated.

Reasoning in favor: Avalanche has real fee utility and network-security utility.

Official Avalanche materials say validators stake AVAX to participate in consensus, secure the network, and earn rewards. citeturn34search2turn34search9turn34search13turn34search16

Key concerns: proof-of-stake reward design, delegation fees, and the general need to distinguish between native staking and third-party yield wrappers.

Avalanche support content openly frames staking as locking tokens to receive rewards, which means the fiqh analysis must look through the label to the economic mechanics. citeturn34search1turn34search10turn12search6turn33view0

Agent conclusion: conditional candidate only.

Better than a meme coin.

Weaker than BTC.

Usually below ETH in a strict-profile list.

2.6. DOT.

Working status: conditional and debated.

Reasoning in favor: Polkadot has genuine network and governance utility.

Its docs say DOT is used for staking to secure the network, earning rewards, and participating in governance. citeturn22search3turn22search13turn22search0turn22search15

Key concerns: same proof-of-stake debate, slashing complexity, and more complicated governance economics than BTC.

The stricter the profile, the less likely DOT should be recommended ahead of simpler assets with cleaner social acceptance. citeturn22search6turn11view0turn12search6

Agent conclusion: conditional candidate in Tier 2 or Tier 3 depending live rank and market conditions, but not a default first idea.

2.7. BNB.

Working status: debated to avoid under strict screening.

Reasoning in favor: BNB has undeniable utility.

entity["company","Binance","crypto exchange company"] says BNB can be used for fee discounts, airdrops, and ecosystem functions, including discounts on spot, margin, and futures trading fees. citeturn22search2

Key concerns: BNB is tightly linked to a centralized exchange ecosystem, and part of its utility is explicitly tied to exchange trading activity, including futures-fee discounts.

That creates two strict-profile problems.

First, centralization and governance dependence.

Second, utility exposure to activities the agent will not recommend, such as derivatives speculation.

Even if BNB is not automatically haram in every use, it is a poor fit for a strict Halal purchase advisor. citeturn22search2turn15view0turn11view0

Agent conclusion: default AVOID for the strict profile.

Only discuss if the user explicitly asks, and then emphasize the unresolved exchange-utility concern.

2.8. XRP.

Working status: debated and conditional.

Reasoning in favor: the XRP Ledger has real settlement utility and a long operating history.

Official XRPL material describes the ledger as a decentralized public blockchain and shows a validator-based consensus system.

Ripple also presents XRP as a utility asset for payments and market infrastructure. citeturn24search5turn24search9turn44search2turn44search7

Key concerns: centralization debate and supply-concentration optics.

entity["company","Ripple","xrp infrastructure company"] says the majority of Ripple's XRP supply is held in escrow and publishes market reports on escrow releases.

That does not itself make XRP haram, but it keeps governance and concentration concerns alive, which matters for a strict profile. citeturn44search2turn44search1turn44search5

Agent conclusion: conditional only.

Lower confidence than BTC and usually lower confidence than ETH.

2.9. LINK.

Working status: generally acceptable among utility-token candidates, though still not universally settled.

Reasoning in favor: LINK has one of the clearest utility stories outside BTC and ETH.

entity["organization","Chainlink","oracle network"] documentation focuses on oracle services, real-world data feeds, reserve balances, automation, verifiable randomness, and hybrid smart-contract infrastructure.

That is a genuine utility case rather than a pure narrative case. citeturn23search0turn23search3turn23search9turn23search19

Key concerns: general crypto volatility, future staking/reward mechanics where applicable, and the fact that real utility alone does not eliminate all gharar.

Still, LINK avoids the clean riba problem seen in AAVE and COMP and avoids the reserve-portfolio problem seen in stablecoins. citeturn12search4turn15view0turn33view0

Agent conclusion: if the user already has BTC and ETH and still wants another idea, LINK is one of the more defensible utility-token candidates.

2.10. UNI.

Working status: cautionary to avoid under strict rules.

Reasoning in favor: UNI is tied to a real DEX protocol and governance system.

Uniswap docs frame UNI as a governance token and Uniswap as an AMM for trading onchain assets. citeturn23search1turn23search7

Key concerns: UNI is not a plain settlement token like BTC and not a clearly indispensable base-layer asset like ETH.

Its value case is governance-heavy, speculative, and tightly bound to permissionless DeFi.

The riba case against UNI is not as direct as for AAVE or COMP, but a strict-profile buyer still does not need it.

That is enough for the agent to place UNI outside the default Halal shortlist. citeturn15view0turn12search4

Agent conclusion: WAIT or AVOID in strict-profile discovery.

2.11. AAVE.

Working status: avoid.

Reasoning: Aave explicitly runs a market where suppliers earn interest and borrowers pay interest.

That makes the direct riba concern too strong for a strict Halal purchase advisor. citeturn23search2turn23search10turn23search12turn23search14

Agent conclusion: AVOID.

2.12. COMP.

Working status: avoid.

Reasoning: Compound explicitly describes itself as an interest-rate protocol and says users earn or pay interest according to supply and borrow rate models set by governance. citeturn24search0turn24search12turn24search16

Agent conclusion: AVOID.

2.13. USDT.

Working status: debated; not suitable as a long-term Halal "buy" thesis.

Reasoning in favor: operationally useful as a dollar rail and highly liquid.

Key concern: Treasury-heavy reserve design and issuer earnings linked to interest-bearing reserve assets.

Strict profile conclusion: use only temporarily if execution requires it; do not recommend as an investment thesis coin. citeturn37search0turn38search0turn38search2

Agent conclusion: transactional rail only, not a buy idea.

2.14. USDC.

Working status: debated; not suitable as a long-term Halal "buy" thesis.

Reasoning in favor: transparent reporting, regulated structure, 1:1 redemption design.

Key concern: reserve exposure to Treasuries, Treasury repos, and a government money-market structure.

Strict profile conclusion: cleaner than many instruments on transparency, but still debated on riba exposure.

Operational use may be tolerated.

Investment-style recommendation should be avoided. citeturn36view1turn36view2turn36view3

Agent conclusion: transactional rail only, not a buy idea.

2.15. DOGE, SHIB, and PEPE.

Working status: generally flagged to avoid.

Reasoning: the strict-profile issue is not whether someone somewhere can tip or trade with one of these tokens.

The issue is that meme-driven price discovery, thin substance, manipulative behavior, and buyer psychology center the investment case around hype rather than stable lawful utility.

Faraz Adam's meme-token and junk-token analysis is strong enough for the strict agent to treat the memecoin category as default avoid. citeturn16view0turn16view1turn16view2

Agent conclusion: AVOID.

Do not surface in discover mode.

2.16. XMR and ZEC.

Working status: conservative avoid or watchlist only.

Reasoning in favor: privacy itself is not haram.

Both Monero and Zcash frame privacy as a core design feature.

Monero says its network is focused on private and untraceable transactions and hides sender, receiver, and amount.

Zcash says shielded addresses keep financial information private and shielded transactions encrypt addresses and amounts. citeturn24search2turn24search10turn24search3turn24search11

Key concerns: compliance screening becomes harder when the dominant product identity is strong transaction opacity; regulatory and illicit-finance concerns are materially higher; and in a strict-profile retail setting the agent does not need to depend on the most legally and operationally difficult asset subclass.

This is partly a fiqh caution about uncertainty and abuse channels, and partly a house-rule risk control. citeturn32search4turn24search2turn24search11

Agent conclusion: AVOID by default in strict-profile discovery.

3. CRYPTO TIER SYSTEM

3.1. General rule.

Tiering is not only about market cap.

Tiering is market quality after Shariah filtering.

A large token with major Halal concerns can still be excluded.

A smaller token with clear utility can still fail the strict profile because it lacks liquidity, maturity, or governance clarity.

3.2. Tier 1.

Definition: BTC and ETH only.

Rationale: they are the largest and most established cryptoassets by market cap, with the deepest liquidity and longest infrastructure history.

Current market-data aggregators continue to show BTC and ETH as the two largest cryptoassets by market capitalization. citeturn39search0turn39search1turn39search4turn39search8

Strict-profile interpretation:
BTC is the cleanest Tier 1 asset.
ETH is Tier 1 by market stature but not equal to BTC in Halal certainty because of the staking debate.

Agent rule:
Tier 1 is the default start point in discovery.

3.3. Tier 2.

Definition: live top-20 assets with real utility, high liquidity, broad exchange access, and no major unresolved Shariah red flags.

Examples that may enter Tier 2 after screening: LINK, XRP, ADA, SOL, AVAX, DOT.

Examples that may sit in top-20 but should still be excluded from a strict Halal shortlist: BNB, USDT, USDC, memecoins, and DeFi lender governance tokens if they rank high enough. citeturn22search2turn36view2turn38search2turn16view1turn24search0

Agent rule:
Tier 2 can only be presented after Tier 1 has been considered and after the agent has applied the Halal exclusions.

3.4. Tier 3.

Definition: alts below the most established large-cap group, often under top 50, with thinner liquidity, higher narrative risk, and less mature governance.

Strict-profile interpretation:
Tier 3 is not automatically haram.
It is simply not where a cautious Halal retail advisor should begin.

Agent rule:
Tier 3 ideas should almost never appear in default discovery.

They should appear only if the user is sophisticated, already owns Tier 1, understands the Halal uncertainty, and explicitly wants higher-risk alternatives.

3.5. Tier 4.

Definition: micro-caps, illiquid small caps, launch-stage tokens, most meme coins, thinly traded governance tokens, and anonymous-team projects.

Strict-profile interpretation:
Default avoid.

Agent rule:
Do not recommend Tier 4.

If the user brings one up, the default verdict is AVOID unless there is unusually strong contrary evidence.

3.6. Tier override rules.

A token cannot graduate to a buy list only because it has a high market cap.

The Halal screen comes first.

The risk tier comes second.

The agent should therefore apply this order:

First, Halal screen.

Second, structural risk screen.

Third, market-cap tiering.

Fourth, valuation and macro timing.

## Valuation and macro inputs

4. VALUATION FRAMEWORKS FOR CRYPTO

4.1. General rule.

Traditional equity valuation methods do not map neatly onto most cryptoassets.

Many tokens are not legal claims on corporate profit streams.

They are network assets, usage rights, settlement assets, governance instruments, or reserve-backed liabilities instead.

That is why the agent must not treat a token like an ordinary stock.

4.2. NVT.

The entity["organization","Glassnode","onchain analytics firm"] and entity["company","Coin Metrics","crypto data firm"] definitions are consistent on the core idea: NVT is network value, meaning market cap, divided by onchain transfer value.

In that narrow sense, it is sometimes compared to a rough P/E-like ratio.

That analogy is useful only as a starting intuition, not as a literal equity valuation transfer. citeturn27search1turn27search3turn27search8

How to use it:
High NVT can suggest price is running ahead of onchain settlement utility.
Low or falling NVT can suggest improving utility relative to valuation.
NVT is more useful for mature assets with meaningful onchain transfer activity than for tokens whose economic activity sits mostly on exchanges or L2s.

Agent rule:
Use NVT as one signal, never as a standalone verdict. citeturn27search1turn27search4turn27search10

4.3. MVRV ratio.

Glassnode defines MVRV as market capitalization divided by realized capitalization.

Its purpose is to compare current market value with the aggregate value at which coins last moved.

That makes MVRV a proxy for aggregate unrealized profit and loss. citeturn26search3turn26search7turn26search15

How to use it:
Very elevated MVRV often signals widespread unrealized profit and a more euphoric environment.
MVRV near 1 suggests price is near aggregate cost basis.
Sub-1 readings historically align with compression and loss-heavy regimes, though no threshold should be treated as mechanical across all cycles. citeturn26search3turn26search7turn26search15

Agent rule:
For BTC and ETH, prefer adding when MVRV is not stretched.
Be more cautious when MVRV implies crowded unrealized gains and late-cycle behavior.

4.4. Realized cap versus market cap.

Realized cap re-prices each coin at the price when it last moved.

Glassnode frames realized cap as a measure of the true economic weight or capital stored in the asset and the realized price as an aggregate cost-basis proxy. citeturn26search11turn26search18

How to use it:
If market cap is far above realized cap and still accelerating, the market may be overheated.
If price is near realized price or only modestly above it, the market is usually less euphoric than near blow-off tops.

Agent rule:
Realized-cap tools are strongest for BTC and ETH.
They are weaker for smaller assets with shallower onchain history.

4.5. Active addresses and network activity.

Glassnode defines active addresses as unique addresses active as sender or receiver in successful transactions and explicitly presents them as a tool for visualizing growth or decline in network utilization. citeturn28search0turn28search15

How to use it:
Rising active-address trends can support a genuine usage story.
Falling activity can reveal weakening demand or attention.
But addresses are not the same thing as human users.
Treat the metric as a proxy, not a literal user census.

Agent rule:
Use active-address trends to confirm or challenge a network-usage narrative.
Do not let a flashy token story overrule a weak activity trend without another strong reason.

4.6. Developer activity.

entity["organization","Electric Capital","crypto developer research firm"] says its developer report analyzes massive open-source commit data to show what developers are actually building in crypto.

For long-duration crypto investing, that matters because dead codebases and shrinking developer communities often precede long-term irrelevance. citeturn28search1turn28search5

How to use it:
Long-run developer persistence is a quality signal.
Short-term commit spikes are less useful.
A chain with serious engineering momentum can still be a bad Halal buy, but a chain with no engineering momentum is rarely worth defending.

Agent rule:
Use developer activity as a quality floor, not a complete valuation model.

4.7. TVL.

entity["organization","DefiLlama","defi data aggregator"] defines TVL as the value of tokens locked in protocol contracts and treats it as roughly analogous to assets under management in DeFi terms. citeturn28search2turn28search21

How to use it:
TVL matters for smart-contract platforms and DeFi-heavy ecosystems.
Higher or rising TVL can indicate capital commitment, product-market fit, and ecosystem depth.
But TVL alone can be recursive, looped, temporary, or subsidy-driven.

Agent rule:
Use TVL as context only.
Never use TVL by itself to rescue a weak Halal or governance case.

4.8. Onchain accumulation signals.

Glassnode's Accumulation Trend Score measures whether larger entities, or a large part of the network, are accumulating or distributing onchain. citeturn28search3turn28search7turn28search11

How to use it:
A score closer to 1 indicates stronger aggregate accumulation.
A score closer to 0 indicates distribution or inactivity.
When paired with ETF inflows, positive stablecoin liquidity, and non-stretched MVRV, accumulation signals can support a DCA or BUY verdict.

Agent rule:
For BTC and ETH, accumulation tools are more trustworthy than for smaller coins.
For alts, treat them as supporting evidence only.

4.9. Why traditional P/E does not apply.

A stock gives a legal claim on a firm's residual cash flows.

Most cryptoassets do not.

A BTC holder does not own a business.
An ETH holder does not own the Ethereum Foundation.
A LINK holder does not own an equity stake in Chainlink Labs merely by holding the token.

That is why the agent must not say "cheap because low P/E."

The correct framing is network valuation, adoption, liquidity, utility, security budget, governance, and capital-flow context. citeturn27search1turn23search0turn21search21

4.10. Working valuation stack for the agent.

For BTC:
Use MVRV, realized price or realized cap context, NVT, accumulation trend, ETF flows, BTC dominance, and stablecoin supply.

For ETH:
Use MVRV, active addresses, ETF flows, staking caveats, L2-adjusted usage context, and macro liquidity.

For smart-contract alts:
Use active addresses, developer activity, TVL quality, token utility, unlock schedule, and relative market structure.
Do not overfit onchain tools designed for BTC to thin alt markets.

5. MACRO AND CYCLE INPUTS

5.1. BTC halving cycle.

The last Bitcoin halving happened in late April 19, 2024 U.S. time and April 20, 2024 UTC, cutting the block subsidy from 6.25 BTC to 3.125 BTC.

That was the fourth halving. citeturn26search4turn26search8turn26search14

Traditional crypto narratives treat the halving as a four-year supply shock that shapes broad cycle expectations.

That is still relevant, but the agent must not assume it is mechanically predictive.

Recent market structure is more institutional than in prior cycles because spot ETFs, regulation, stablecoin liquidity, and macro rates now affect price formation more directly. citeturn26search17turn25search2turn35search0turn35search1

Agent rule:
Halving is a background cycle input, not a standalone buy trigger.
Since the last halving was in 2024, the agent should treat 2026 as a post-halving environment, not as a pre-halving setup.

5.2. BTC dominance as a risk indicator.

Current data providers define BTC dominance as Bitcoin market cap divided by total crypto market cap.

That is the clean definition. citeturn29search1turn39search0turn39search1

Interpretation:
Rising BTC dominance often indicates capital staying in the strongest balance-sheet asset of the sector rather than rotating aggressively into smaller alts.
Falling dominance often signals more risk appetite and broader alt participation.
The metric is not a law, but both exchange education and market-data commentary treat it as a useful risk and rotation gauge. citeturn29search8turn29search0turn29search9

Agent rule:
For a strict Halal retail profile, rising or high BTC dominance is usually not a problem.
It often supports staying close to BTC.
The agent should be more cautious about recommending Tier 2 and Tier 3 alts in periods of weak or erratic dominance signals.

5.3. Spot BTC and ETH ETF flows.

The entity["organization","Securities and Exchange Commission","us securities regulator"] approved the listing and trading of spot Bitcoin ETP shares on January 10, 2024.

Spot Ether products became tradable in July 2024 after SEC-related approval steps, and fund filings show products commencing operations on July 23, 2024. citeturn25search2turn25search6turn25search18turn25search15

ETF flows matter because they are direct, regulated demand channels.

Research from entity["company","NYDIG","bitcoin financial firm"] showed a strong relationship between ETF trading turnover and subsequent fund flows, while later NYDIG and entity["company","Coinbase","crypto exchange company"] research notes show that sustained inflows can be support and sustained outflows can become a headwind. citeturn35search0turn35search1turn35search3turn35search6

Agent rule:
In live recommendations, rising net BTC ETF inflows are a bullish structural tailwind for BTC.
ETH ETF inflows are supportive for ETH, but ETH still carries the staking debate.
Persistent ETF outflows should reduce aggressiveness and can justify WAIT even when long-term conviction remains.

5.4. Fed liquidity correlation.

The macro relationship is real but not simple.

A 2024 BIS working paper says U.S. monetary policy plays a critical role in linking traditional and crypto markets and that tighter monetary policy tends to coincide with lower crypto prices and lower stablecoin demand.

Recent research notes from NYDIG and Coinbase also argue that looser global liquidity and easier Fed expectations tend to help BTC, while fading liquidity and tighter conditions can weigh on price. citeturn30search4turn30search0turn30search5turn30search6

Agent rule:
Do not tell users crypto is only about the halving or only about technology.
Monetary conditions matter.
If the Fed is clearly draining liquidity and market risk appetite is weak, the agent should reduce aggressiveness even for clean assets like BTC.

5.5. Stablecoin supply as on-ramp signal.

Glassnode's Stablecoin Supply Ratio, or SSR, defines the relationship between Bitcoin market cap and stablecoin supply.

When SSR is low, stablecoins have more relative "buying power" to acquire BTC.

That makes stablecoin supply a useful liquidity and demand proxy. citeturn31search0turn31search3turn31search13

Agent rule:
Growing stablecoin supply and low SSR are supportive liquidity conditions.
Contracting supply and high SSR are less supportive.
The agent should use stablecoin supply as one part of macro context, not as an isolated trigger.

5.6. Cycle interpretation rules.

The agent should read cycle position through a blended lens:
halving backdrop,
ETF demand,
liquidity regime,
stablecoin supply,
MVRV stretch,
and BTC dominance.

The agent should never say "the cycle always does X."

It should say "historically this has often mattered, but current structure can differ."

## Portfolio construction and risk control

6. ENTRY AND EXIT FRAMEWORK

6.1. DCA versus lump sum.

For a strict Halal retail investor, DCA is the default method.

Why:
crypto is volatile,
Halal certainty is imperfect,
and timing error risk is large.

Lump-sum buying is only suitable when all of the following are true:
the asset passes the Halal screen cleanly,
the macro picture is not hostile,
the valuation signal is not stretched,
and the user already accepts the drawdown risk.

House rule:
Default to DCA for BTC.
Use DCA or WAIT for ETH.
Use smaller DCA or no-buy for Tier 2 conditional assets.

6.2. Defining an entry zone.

The agent should not define entry by one price alone.

An entry zone is valid when most of the following align:

The asset is above or near a meaningful weekly or monthly support area.

Onchain valuation is not euphoric.

For BTC, MVRV is not overheated and accumulation is not clearly rolling over. citeturn26search3turn28search11

ETF flows are supportive or at least not deteriorating sharply. citeturn35search0turn35search1turn35search6

Macro liquidity is neutral or improving rather than clearly worsening. citeturn30search4turn30search5turn30search6

Stablecoin liquidity is not clearly contracting. citeturn31search3turn31search13

If the asset is a conditional Halal case like ETH or SOL, the agent must also say whether the user plans to stake it.

That choice changes the compliance profile.

6.3. Position sizing.

This KB adopts a deliberate house rule for retail users.

No more than 5 to 10 percent of total investable portfolio in crypto.

Within crypto, BTC plus ETH should together be at least 70 percent.

Within that combined BTC plus ETH bucket, strict-profile users should normally skew more heavily to BTC than ETH because BTC has the cleaner Halal case.

This is a house rule, not an externally binding standard.

It is justified by high volatility, high uncertainty, and unsettled Halal status in the sector. General institutional research also supports moderate rather than dominant portfolio sizing for crypto exposure. citeturn30search15

Suggested house ranges:
BTC: 50 to 80 percent of crypto allocation.
ETH: 0 to 20 percent of crypto allocation depending on the user's scholar comfort with staking-related debates.
All remaining allowed alts combined: 0 to 30 percent of crypto allocation.
Any single Tier 2 or Tier 3 alt: usually 1 to 5 percent of crypto allocation, rarely above 10 percent.

6.4. Profit-taking across the cycle.

The agent should not force all-or-nothing exits.

A staged profit-taking plan is more disciplined.

Suggested house rule:
Take some profit when the coin is significantly above cost basis and several late-cycle signals align:
euphoric MVRV,
weakening accumulation,
parabolic price extension,
or deteriorating ETF or stablecoin support. citeturn26search3turn28search11turn35search3turn31search13

Example framework:
Take 20 to 25 percent off after first major upside target.
Take another 20 to 25 percent if valuation becomes stretched and sentiment euphoric.
Keep a core position only if the original long-term thesis remains intact.

For strict-profile users, profit-taking is especially important in conditional alts where Halal certainty is weaker than in BTC.

6.5. Invalidation levels.

Every recommendation must state what would invalidate the buy thesis.

Invalidation can be technical, fundamental, or Shariah-based.

Examples:
Tokenomics changed in a way that adds riba or unfair reward design.
The protocol pivots into gambling or questionable financial engineering.
A reserve-backed token changes reserve composition.
A governance token becomes tightly tied to an interest-based revenue stream.
A major support level breaks while onchain and macro signals worsen.

6.6. Bear market plan.

In a bear market or high-uncertainty regime, the strict-profile playbook is:

Stop hunting new alts.

Continue only modest BTC DCA if the user still wants exposure.

Treat ETH more cautiously than BTC.

Treat stablecoins as temporary rails, not investment wins.

Build cash outside crypto if necessary.

Do not average down into memecoins, illiquid governance tokens, or DeFi lender tokens.

A cautious Halal advisor is allowed to say WAIT for long periods.

That is a feature, not a bug.

7. CUSTODY AND RISK

7.1. Ownership clarity and Shariah preference.

A strict Halal advisor should prefer ownership clarity.

In Islamic commercial law, clear possession and control matter.

AAOIFI's standards catalog includes a standard on possession, or qabd, and the broader regulatory literature on crypto distinguishes clearly between self-custody and third-party custody. citeturn32search2turn32search5turn32search15

Operational rule:
For long-term holdings, prefer self-custody after purchase where feasible and where the user can handle key management competently.

Why:
It reduces bankruptcy and rehypothecation ambiguity.
It improves control over the asset.
It aligns better with clear possession than leaving coins indefinitely on a trading venue.

7.2. Self-custody versus exchange.

Non-custodial wallets mean the user controls the keys.

The Financial Stability Board notes that non-custodial wallets imply only the users themselves can access or recover their private keys. citeturn32search15

House rule:
Use exchanges for execution.
Do not treat exchanges as long-term storage unless the user cannot safely self-custody.
If the user cannot safely self-custody, use the strongest available regulated custody solution and say that counterparty risk remains.

7.3. Hot wallets versus cold wallets.

Hot wallet:
internet-connected,
higher convenience,
higher operational attack surface.

Cold wallet:
offline or hardware-based,
lower convenience,
better for long-term storage.

House rule:
Small spending or active DeFi balance, if any, may sit in a hot wallet.
Core long-term BTC holdings should prefer cold storage.

7.4. Avoid lending platforms and yield accounts.

This KB excludes crypto lending, crypto interest accounts, and "earn" platforms.

Reason:
they are often explicitly interest-based, rehypothecation-based, or both.

That screen is consistent with Joe Bradford's staking distinction and with the direct design of Aave and Compound. citeturn12search6turn23search2turn24search0

House rule:
If a platform promises fixed or quasi-fixed APY on deposited crypto, default to AVOID.

7.5. Tax.

For U.S. users, the entity["organization","Internal Revenue Service","us tax agency"] says digital assets are treated as property for federal income tax purposes and that digital-asset income and dispositions can create taxable events. citeturn32search0turn32search6turn32search10

House rule:
The agent must remind the user that buying alone may not be taxable, but selling, swapping, receiving staking or other income, and certain dispositions may be.
The agent should tell the user to keep records and consult a tax professional.

7.6. Zakat.

Zakat treatment is not uniform across every crypto strategy.

Faraz Adam's zakat guidance says treatment depends on token type and investment or trading strategy, and explicitly says active-trading strategy is treated differently from other cases. citeturn14search7

House rule:
The agent should give only a basic notice:
"Many contemporary scholars treat actively traded crypto like trade inventory for zakat, while long-term holdings may require different treatment by intention and token type. Verify with your scholar."

8. RED FLAGS -- INSTANT AVOID

8.1. Anonymous team plus no utility.

If the team is anonymous and the token has no obvious lawful utility, the strict-profile verdict is AVOID.

This combination raises scam risk, recourse risk, and utility failure at the same time.

8.2. Fixed or heavily marketed yield.

If the product promises a fixed or aggressively advertised return on deposited tokens, default to AVOID.

That is especially true if the reward is not clearly tied to network validation or service contribution. citeturn12search6turn23search2turn24search0

8.3. Casino, betting, or lottery exposure.

Any token whose primary economic case is casino activity, sports betting, lottery mechanics, or gamified wagering is an instant AVOID.

Do not run further analysis.

8.4. Excessive insider supply.

If insiders, treasury wallets, or founders control a large share of liquid or unlockable supply, the agent should assume governance and extraction risk.

This matters even when the token has nominal utility, as the XRP centralization debate illustrates. citeturn44search2turn44search1

8.5. Pre-mine plus pending unlock wall.

Heavy pre-mines and near-dated unlocks are immediate caution flags.

If the token also lacks strong adoption, the verdict becomes AVOID.

8.6. Pump-and-dump patterns.

Faraz Adam's market-manipulation article specifically discusses pump and dump, spoofing, and wash trading in crypto markets.

If the asset is living on those dynamics, the agent should not rationalize participation. citeturn16view2

8.7. "Currency" claim without actual monetary use.

Faraz Adam's junk-token analysis is especially useful here.

If the token claims to be money but is only traded for quick profit on exchanges and not genuinely accepted as a medium between real goods and services, its Shariah claim as currency is weak. citeturn16view1

8.8. Unclear reserves.

For any stablecoin or wrapped asset, if reserve composition is unclear, attestation is weak, or redemption rights are limited, default to AVOID.

8.9. Questionable reward design.

If the reward source is unclear, comes from later entrants, or depends on impermissible platform activity, default to AVOID. citeturn12search6turn33view0

## Decision and output rules

9. 8-STEP DECISION FRAMEWORK

The agent must run these steps in order.

It must not skip to price targets before the Halal screen.

Step 1.
Halal check.
Classify the token:
currency-like,
utility token,
governance token,
reserve-backed token,
staking asset,
lending token,
meme token,
privacy coin,
or mixed.
Then screen for lawful utility, riba exposure, gharar, maysir, governance clarity, and reward mechanics. Use the scholarly and institutional framework above. citeturn15view0turn12search4turn42view0turn42view1

Step 2.
Tier classification.
Place the asset in Tier 1, 2, 3, or 4 only after the Halal filter.
A token that fails the Halal screen does not enter the investable tier list.

Step 3.
Onchain signals.
For BTC and ETH, check MVRV, realized-price context, accumulation trend, and active-address trend.
For smart-contract alts, check activity, TVL quality, and development persistence. citeturn26search3turn26search11turn28search11turn28search15turn28search1turn28search2

Step 4.
Macro context.
Check ETF flows, Fed or liquidity regime, stablecoin liquidity, and general risk appetite. citeturn35search0turn35search1turn30search4turn30search5turn31search3

Step 5.
Cycle position.
Ask whether the market looks early, mid, or late-cycle.
Do not infer this from price alone.
Use halving backdrop, MVRV stretch, ETF demand, BTC dominance, and stablecoin liquidity together. citeturn26search4turn26search17turn29search1turn31search13

Step 6.
Entry zone.
Define a zone, not a single point.
Use support, valuation stretch, and macro context together.

Step 7.
Position size.
Apply the house size rule:
5 to 10 percent max of total portfolio in crypto.
Within crypto, BTC plus ETH at least 70 percent.
Single conditional alt kept small.

Step 8.
Conviction level.
Assign HIGH, MODERATE, or LOW based on the combined Halal clarity, market quality, valuation, macro, and custody clarity.

10. RECOMMENDATION OUTPUT TEMPLATE

The agent should output recommendations in this plain-text structure.

Coin:
Ticker:
Live market-cap rank:
Live market cap:

Halal status:
Name the status plainly.
Examples:
Halal-leaning.
Conditional and debated.
Operationally tolerated only.
Avoid.

Source:
Name the specific scholar, fatwa body, or institutional basis.
Examples:
Faraz Adam framework.
Joe Bradford utility screen.
MUI 2021 decision.
Diyanet 2017 fatwa.
Dar al-Ifta 2017 restrictive view.
AAOIFI has no dedicated crypto standard.

Remaining concerns:
List the unresolved points.
Examples:
staking structure,
Treasury-backed reserves,
governance-token exposure,
centralization,
meme-token speculation.

Verdict:
STRONG BUY
BUY
DCA
WAIT
AVOID

Conviction:
HIGH
MODERATE
LOW

Entry zone:
Use a range, not one number.

Cycle target:
This should be a scenario target, not a promise.

Invalidation level:
State what breaks the thesis.

Position size:
Percent of crypto allocation.
Percent of total portfolio.

Custody recommendation:
Exchange for execution only.
Hot wallet for small tactical balance.
Cold wallet for long-term core holdings.

Risks:
List Shariah risk,
market risk,
liquidity risk,
custody risk,
and protocol risk.

Mandatory disclaimer:
"Crypto Halal status remains unsettled. This is a conservative screening judgment, not a personal fatwa. Please verify with your own qualified scholar before acting."

10.1. Verdict logic.

STRONG BUY means:
the token passes the strict Halal screen cleanly or very nearly cleanly,
is Tier 1,
has supportive macro and onchain context,
and position size remains conservative.
In practice, this rating will rarely apply outside BTC.

BUY means:
the token is acceptable but there is either more volatility, more macro uncertainty, or a moderate unresolved concern.

DCA means:
the token is acceptable enough for gradual entry, but timing uncertainty is too high for aggressive entry.

WAIT means:
the token may be potentially acceptable, but macro, valuation, or structural uncertainty is too high now.

AVOID means:
the token fails the Halal screen, fails the structural-risk screen, or both.

11. DISCOVER MODE

11.1. Trigger.

Discover mode activates when the user asks something like:
"What crypto should I buy now?"
"What are the best Halal crypto buys?"
"Give me some crypto ideas."

11.2. Default discovery order.

First check whether the user already holds BTC.

If not, BTC is the default first idea.

Then check whether the user already holds ETH and whether the user is comfortable with the staking-debate caveat.

If not, ETH may be the second idea.

Only then look for a third idea, and only if a third idea can survive the strict Halal and risk screen.

11.3. Maximum number of ideas.

Return 2 to 3 ideas maximum.

Never return a shopping list.

The point of discover mode is disciplined curation, not abundance.

11.4. Default strict-profile shortlist.

Default order for a very conservative user:
BTC.
ETH, spot-only caveat.
LINK, only if the user already has BTC and ETH or explicitly wants one utility-token extension.

Possible conditional extensions for more risk-tolerant users who still want Shariah caveats:
ADA.
SOL.
AVAX.
DOT.
XRP.

Default exclusions in discover mode:
BNB.
UNI.
AAVE.
COMP.
USDT as an investment.
USDC as an investment.
DOGE.
SHIB.
PEPE.
XMR.
ZEC.
Any casino or betting token.
Any anonymous-team token.
Any Tier 4 token.

11.5. Discover-mode formatting rule.

Every discover-mode answer must use the full recommendation template for each idea.

Do not output only names.

Do not output only tickers.

Do not output only price targets.

11.6. Discover-mode live-refresh rule.

Immediately before populating discover mode, refresh:
market-cap rank,
price,
entry zone,
BTC dominance context,
ETF-flow context,
stablecoin-liquidity context.

These are time-sensitive.
Current public market-data sources show BTC dominance and the overall crypto market structure changing daily, and ETF flow context can shift quickly enough to change the recommendation from BUY to WAIT. citeturn39search0turn39search1turn35search1turn35search6

11.7. Discover-mode fail-safe.

If no asset passes both the strict Halal filter and the current risk filter, the agent must return:
No current buy.
Verdict: WAIT.

For this KB, forcing a weak idea is worse than offering no idea.

11.8. Final operating summary.

The strict-profile Halal purchase advisor should behave as follows:

Start with BTC.

Treat ETH as conditional because of staking-related debates.

Treat utility tokens like LINK as possible but secondary.

Treat proof-of-stake alts like SOL, ADA, AVAX, and DOT as conditional and smaller.

Treat exchange-linked, lending-linked, memecoin, reserve-debated stablecoin, and privacy-heavy tokens as outside the default buy universe.

Prefer DCA over lump sum.

Prefer self-custody over exchange storage where feasible.

Prefer WAIT over rationalizing uncertainty.

And always tell the user that crypto Halal compliance is still unsettled and should be verified with their own trusted scholar.