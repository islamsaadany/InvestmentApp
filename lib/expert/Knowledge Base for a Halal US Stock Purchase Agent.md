# Knowledge Base for a Halal US Stock Purchase Agent

Purpose.
This document defines the operating rules for an AI agent that advises a retail investor on purchasing individual U.S.-listed common stocks under strict halal constraints.
The agent is for long-only cash purchases of common shares listed on NYSE or NASDAQ.
It is not for margin, shorting, options, futures, preferred shares, leveraged products, or synthetic exposure.
If the agent cannot verify halal status with current enough data, the default output is WAIT, not BUY.

Operating principle.
Halal compliance is a hard gate.
No upside case,
no valuation argument,
and no technical setup
can override a failed or stale Shariah screen.

Data freshness rule.
Business activity screens are relatively stable.
Financial-ratio screens are not.
A stock can move from compliant to non-compliant,
or the reverse,
after new quarterly filings,
market-cap changes,
or methodology changes.
The agent must therefore treat halal status as time-sensitive. citeturn8search2turn8search3turn8search7turn8search8turn8search14

Interpretation rule.
This KB is a decision framework,
not a fatwa.
Where scholars,
index providers,
and commercial screeners disagree,
the agent must say so explicitly,
present the competing views,
and then state which rule-set it is applying to reach its verdict.

## HALAL STOCK SCREENING

Section 1.

### Scope of the halal gate

The halal gate has two layers.

Layer one is business activity.
The company’s core business must be permissible.

Layer two is financial screening.
Even if the business is broadly permissible,
the company can still fail because leverage,
cash placement,
receivables mix,
or non-permissible income exceed the relevant screen.

This two-stage structure is standard across the major Shariah index families and commercial screening tools,
even though the exact ratios and denominators differ. citeturn10search1turn42view2turn42view0turn10search3

### What the core AAOIFI standard is doing

entity["organization","AAOIFI","islamic finance standards"] is the main global standard setter in Islamic finance,
and Shariah Standard No. 21 on financial papers,
shares,
and bonds is the root reference most halal-equity screeners point back to. citeturn7search10turn7search5turn7search16

In practical stock-screening terms,
AAOIFI-style screening asks four questions.

First,
is the company’s main business halal?

Second,
is non-permissible revenue small enough to be tolerated under the chosen screen?

Third,
are interest-bearing debt and interest-bearing assets low enough?

Fourth,
is the stock’s underlying asset mix acceptable under the chosen interpretation of the standard,
which is where some of the variation on cash,
receivables,
and liquidity comes from? citeturn6search1turn6search2turn7search1turn9search1

### Excluded sectors and activities

The biggest consensus exclusions are the following.

Conventional banking and other interest-based financial institutions.

Conventional insurance.

Alcohol.

Gambling and gaming.

Adult entertainment and pornography.

Pork and non-halal food production.

Tobacco.

Many screens also exclude entertainment more broadly,
including cinema,
music,
pornography,
and hotels,
and many also exclude weapons,
arms,
and defense manufacturing. citeturn10search3turn9search1turn9search4turn9search14

Examples of categories the agent should normally reject immediately:

Commercial banks.

Broker-dealers whose core revenue model depends on interest-bearing finance.

Conventional insurers.

Brewers,
distillers,
wine and spirits producers.

Casino operators,
sportsbooks,
online betting platforms,
lotteries.

Pornography and explicit-content producers.

Pork processors,
packagers,
or distributors.

Tobacco and nicotine pure-plays.

Arms and defense manufacturers,
if the applied methodology excludes them.

Pure-play music and movie businesses,
if the applied methodology excludes them.

The agent should treat “core business” as controlling.
If the prohibited activity is central to the business model,
there is no need to continue the analysis.

### Sector exclusions are not perfectly uniform

There is broad consensus on excluding interest-based finance,
alcohol,
gambling,
pork,
and adult entertainment.

There is less clean uniformity on edge cases.

Weapons and defense.
Many major Shariah index methodologies do exclude weapons,
arms,
and defense manufacturing,
but some investor debates go beyond classic Shariah screens and argue that modern political,
military,
or supply-chain exposure should matter even if a company passes standard sector and ratio screens.
That means a stock can screen halal under a classic methodology while still failing an investor’s stricter ethical overlay. citeturn10search3turn10search20

Music,
movies,
and diversified media.
entity["organization","FTSE Russell","index provider"] describes entertainment exclusions broadly enough to include casinos,
gambling,
cinema,
music,
pornography,
and hotels.
Some scholars and retail investors are stricter than others on diversified entertainment businesses,
hospitality groups,
and mixed-media conglomerates.
The safe agent behavior is to treat pure-play entertainment names as excluded
and mixed businesses as methodology-sensitive,
not automatically halal. citeturn10search3turn9search0

Insurance.
Conventional insurance is usually excluded.
Takaful is a separate category.
Even outside pure equity screening,
scholarly writing generally treats conventional insurance as prohibited or at least highly contested because of gharar,
maysir,
and riba issues,
while acknowledging minority permissive views in some circumstances.
For stock screening,
the base policy should be:
conventional insurers fail;
takaful names require separate review. citeturn12search2turn10search10

### Ratio thresholds by methodology family

This is where many retail investors get confused.

The words “halal stock” can hide different denominator choices,
different averaging periods,
and different asset tests.

That is why two apps can give different answers on the same ticker
without either app necessarily being “wrong.”

#### AAOIFI-linked retail implementation

Both entity["company","Zoya","halal investing app"] and entity["company","Musaffa","halal screening platform"] publicly present an AAOIFI-based retail screen centered on three headline numbers:

Interest-bearing debt below 30% of market capitalization.

Interest-bearing securities or assets below 30% of market capitalization.

Impermissible income below 5% of total income or revenue. citeturn1search0turn6search1turn6search2turn6search4turn6search7

This is the simplest operational version for a retail agent.
It is also the most common retail shorthand:
30,
30,
and 5.

Important caveat.
AAOIFI-linked material outside retail app summaries also discusses receivables,
cash,
and liquidity-style tests,
and some AAOIFI-oriented implementations do not collapse everything into the retail-friendly 30/30/5 summary.
That means the retail shorthand is useful,
but it is not the full universe of AAOIFI-related discussion. citeturn7search1turn9search1turn10search19

#### S&P Shariah methodology

entity["organization","S&P Dow Jones Indices","index provider"] uses a market-value framework with averaging,
not a simple spot market-cap check.

The current S&P Shariah methodology documents show leverage compliance as debt divided by market value of equity using a 36-month average,
with a threshold below 33%.
The methodology also uses additional cash and receivables tests,
including accounts receivable versus market value of equity using a 36-month average,
with a threshold below 49%.
This is one reason a name can pass an AAOIFI-style 30/30/5 app but fail an S&P-style screen,
or vice versa. citeturn42view0turn5search16turn8search13

Operational takeaway for the agent:
if the user explicitly asks for an S&P-style view,
use the averaged-market-value logic
and do not substitute the retail spot-market-cap shortcut.

#### FTSE Yasaar methodology

FTSE Yasaar uses total assets as the denominator for the main financial tests.

The published FTSE Yasaar rules and related materials describe the following thresholds:

Debt less than 33.333% of total assets.

Cash and interest-bearing items less than 33.333% of total assets.

Receivables and cash less than 50% of total assets. citeturn5search6turn5search18turn10search3turn42view1

This is materially different from a market-cap denominator.
In falling markets,
a market-cap denominator can tighten quickly.
An asset denominator is usually less sensitive to daily share-price volatility.

Operational takeaway for the agent:
if a stock looks borderline under a market-cap screen,
a FTSE-style asset-based screen may produce a different result.
The agent must name the methodology it is using.

#### MSCI Islamic methodology

entity["organization","MSCI","index provider"] explicitly distinguishes between two variants.

The MSCI Islamic Index Series uses total assets as the denominator.

The MSCI Islamic M-Series uses average issuer market capitalization as the denominator. citeturn42view2turn5search11turn8search17

This matters because the same issuer can move across the pass/fail line depending on whether the denominator is total assets or average market capitalization.

Operational takeaway for the agent:
never say “MSCI says halal” without specifying which MSCI Islamic variant is meant.

#### Dow Jones Islamic methodology

Dow Jones Islamic materials have historically used market-value-based ratio screens and business-activity exclusions,
and official methodology materials indicate quarterly review and rebalancing in March,
June,
September,
and December. citeturn8search21turn5search9turn9search10

Operational takeaway for the agent:
the exact historical Dow Jones ratios used in the user-facing answer should only be stated if the agent can verify the current methodology document;
otherwise the safe summary is:
market-value-based,
business exclusions first,
financial ratios second,
quarterly review cadence.

### How the commercial tools differ

#### Zoya

Zoya is a retail halal-investing app.
Its help center says its default methodology is AAOIFI,
but users can also switch to other methodologies,
including S&P,
MSCI,
Dow Jones,
and FTSE.
Its blog explains that denominator choices,
averaging windows,
and style biases are a big reason different methodologies disagree.
Its public-facing materials also stress ongoing monitoring and alerts when compliance status changes. citeturn1search0turn3search0turn3search2turn8search2turn8search10

Interpretation.
Zoya is best understood as a retail front end with a methodology switcher.
Its answer is not “the one true halal answer.”
It is a methodology-specific answer.

#### Musaffa

Musaffa presents itself as an AAOIFI-based halal-screening platform for retail investors.
Its academy content repeatedly describes the screen in 30% debt,
30% interest-bearing assets or securities,
and 5% impermissible income terms.
It also emphasizes watchlists,
compliance history,
and monitoring around new financial reports. citeturn6search1turn6search2turn6search5turn8search3turn8search15

Interpretation.
Musaffa is closer to a fixed retail AAOIFI-style rule set.
If the user wants consistency and simplicity,
Musaffa-like logic is operationally easier than a methodology-switcher.

#### IdealRatings

entity["company","IdealRatings","screening technology"] is an institutional screening engine rather than a simple retail screener.
Its corporate materials emphasize customization,
mandate management,
broad global coverage,
Shariah and ESG overlays,
and a purification engine.
Its sample AAOIFI compliance reports show not only interest-bearing debt and investments tests,
but also liquidity or share-type checks,
illustrating that institutional AAOIFI implementations can be more granular than the retail 30/30/5 shorthand. citeturn1search3turn7search0turn7search1turn7search11

Interpretation.
IdealRatings is not one methodology so much as a platform capable of implementing multiple mandates.
Two institutions using IdealRatings can legitimately get different outputs on the same issuer if their mandates differ.

### Practical comparison the agent should memorize

If the user asks,
“Why does one app say halal and another say not halal?”
the agent should answer like this:

One,
they may be using different business-taxonomy mappings.

Two,
they may be using different financial denominators:
spot market cap,
average market value,
or total assets.

Three,
they may be using different averaging windows.

Four,
they may differ on how they classify mixed revenue segments,
interest-bearing instruments,
or borderline industries.

Five,
one may be using a simplified retail AAOIFI interpretation,
while another may include more detailed liquidity or mandate-specific rules. citeturn3search0turn42view0turn42view1turn42view2turn7search1

### The agent’s default screening policy

For a retail purchase agent,
the cleanest default is:

Default methodology:
AAOIFI-style retail screen.

Primary hard rules:
core business permissible;
interest-bearing debt under 30% of market cap;
interest-bearing assets or securities under 30% of market cap;
non-permissible income under 5%.

Secondary caution rules:
if the stock is near the threshold,
or if another major screen disagrees,
downgrade to WAIT pending live re-check.

Escalation rule:
if the user specifically asks for FTSE,
MSCI,
S&P,
or Dow Jones methodology,
switch to that methodology and state the switch clearly.

### Purification and zakat basics

Purification and zakat are not the same thing.

Purification means removing the impure portion of income that may flow through from tolerated non-permissible revenue.
Major Shariah equity screens usually tolerate a small amount of non-permissible revenue,
commonly up to 5%.
That tolerance does not mean the associated income is ignored;
it means the investor may need to purify that portion by donating it away. citeturn6search1turn6search2turn10search12

Operational rule for dividends.
If the stock or fund sponsor publishes a purification amount,
use that number.
Some halal platforms and fund sponsors publish purification tools or per-share figures,
including quarterly purification disclosures for halal ETFs and separate purification calculators. citeturn14view0turn6search11

Operational rule for individual stocks.
If a direct purification figure is unavailable,
the agent should not invent one.
It should say:
“Purification requires a live compliant-data source or a validated calculator tied to the stock’s revenue mix.”

Zakat is a separate annual obligation.
It is not a substitute for purification.
Because zakat treatment can depend on intention,
holding period,
fiqh method,
and whether the investor treats the shares like trading inventory or long-term business ownership,
the purchase agent should only provide a high-level reminder unless it has a validated zakat workflow. citeturn12search0turn6search11

Minimum safe wording for the agent:
“Purification may apply to dividends or impure income.
Zakat is separate and should be calculated using your chosen fiqh method or a validated calculator.”

### Why compliance can change quarter to quarter

Three moving parts can flip a stock’s status.

New financial statements.
Debt,
cash,
interest-bearing securities,
and revenue mix can move every quarter. citeturn8search7turn8search14turn8search15

Market capitalization.
If the denominator uses market cap,
a sharp stock-price selloff can worsen the ratio even if debt stays flat.

Methodology changes or mandate differences.
A stock may pass under one denominator and fail under another,
or pass under a retail simplification and fail under an institutional mandate. citeturn3search0turn42view2turn42view0

Therefore the agent’s compliance rule is:

For any live “Should I buy X?” question,
screen as of the most recent available quarter and price context.

If the last screen is older than one quarter,
state it as stale.

If the date is unknown,
state status as unverified.

### Re-screening cadence

Best practice for the agent:

Re-screen before every purchase decision.

Re-screen after each quarterly filing.

Re-screen after any major earnings release if the company’s balance sheet or revenue mix may have changed materially.

Re-screen after a large price collapse if the methodology uses market-cap denominators.

Re-screen before adding to an existing position,
not just before first purchase. citeturn8search2turn8search3turn8search7turn8search8

### Late-2025 reference list of large-cap U.S. halal names

Important warning.
The list below is a reference basket,
not a trade-ready live screen.

It is built from official and quasi-official halal ETF materials around 2025 to early 2026,
including the annual report for the Wahed FTSE USA Shariah ETF as of May 31, 2025,
Wahed’s published fund materials,
Zoya’s 2025 ETF summary,
and Wahed’s published holdings sheet dated May 1, 2026.
A stock on this list must still be re-verified before any trade,
because quarter-to-quarter halal drift is real. citeturn23search0turn26view0turn14view0turn15view2turn30view0

Reference names that repeatedly appear in U.S. halal universes around that period include:

Technology and communication services.

entity["company","Microsoft","software company"]

entity["company","Apple","consumer electronics"]

entity["company","Alphabet","search and cloud"]

entity["company","Meta Platforms","social media"]

entity["company","Broadcom","semiconductor company"]

entity["company","Cisco Systems","networking company"] citeturn27view2turn27view3turn15view2turn30view0

Consumer discretionary.

entity["company","Tesla","electric vehicles"]

entity["company","DR Horton","homebuilder"]

Dollar Tree

eBay citeturn27view2turn30view0

Health care.

entity["company","Johnson & Johnson","healthcare company"]

entity["company","Abbott Laboratories","medical devices"]

entity["company","Danaher","life sciences"]

Gilead Sciences

Quest Diagnostics citeturn27view2turn15view2turn30view0

Consumer staples.

entity["company","Procter & Gamble","consumer goods"]

entity["company","Coca-Cola","soft drinks"]

Hershey

Church & Dwight citeturn27view2turn15view2

Energy.

entity["company","Exxon Mobil","oil and gas"]

entity["company","Chevron","oil and gas"]

entity["company","ConocoPhillips","oil and gas"]

EOG Resources

Devon Energy citeturn27view2turn30view0

Industrials and materials.

entity["company","Cummins","engines manufacturer"]

Carrier Global

Cintas

Emerson Electric

CRH

Corteva

GE Vernova citeturn30view0

Real estate and infrastructure-like exposure.

entity["company","Digital Realty Trust","data centers"]

CBRE Group

CoStar Group citeturn30view0

What the agent should say about this list:

“These are reference examples from major U.S. halal ETF and Shariah-index universes around late 2025 to early 2026.
Do not treat inclusion here as a live certification.
Re-screen before every trade.”

### Stock-list limitations the agent must disclose

The agent should say three things when presenting any halal stock list.

One,
methodologies differ.

Two,
status drifts over time.

Three,
point-in-time historical year-end reporting is not always as accessible as current holdings or annual reports.

The safest phrasing is:
“Reference list only.
Re-verify with a live screen before execution.”

## FUNDAMENTAL ANALYSIS FRAMEWORK

Section 2.

### What fundamentals are for

Fundamentals answer one question:
is this a good business,
at a sensible price,
with a balance sheet that can survive stress?

For a halal investor,
fundamentals also have an additional filter:
high leverage is not only a financial risk;
it is also a potential Shariah-failure risk.
That makes balance-sheet discipline more central than it is in many conventional screens.

### Core valuation ratios

P/E.
Price divided by earnings per share.
Use trailing P/E to see what investors are paying for the last twelve months of earnings.
Use forward P/E to see what they are paying for next year’s estimated earnings.
Both are most useful when compared with the company’s own history,
its sector,
and the broad market.
A higher P/E is not automatically bad if growth is higher,
but an elevated P/E with slowing growth raises risk. citeturn31search1turn34view1turn36view0

PEG.
P/E divided by projected EPS growth.
It is a way to adjust valuation for expected growth.
As a rough heuristic,
a PEG around or below 1 can look attractive,
while a materially higher PEG says the market is already paying up for future growth.
The agent should never use PEG in isolation,
because analyst growth estimates are fragile. citeturn34view1turn36view0

P/B.
Price divided by book value per share.
This matters more in asset-heavy and balance-sheet-heavy businesses than in software or brand-heavy businesses.
A low P/B can indicate undervaluation,
but it can also signal poor asset quality or deteriorating returns.
The agent should downweight P/B for intangible-heavy businesses. citeturn35search1turn36view0

P/S.
Market value divided by sales.
Useful when earnings are weak,
cyclical,
or temporarily distorted.
Because sales are usually more stable and harder to manipulate than earnings,
P/S can be a useful cross-check,
especially in earlier-stage or margin-transition businesses. citeturn36view0

EV/EBITDA.
Enterprise value to earnings before interest,
taxes,
depreciation,
and amortization.
This is useful when comparing businesses with different capital structures because enterprise value includes debt.
For a halal agent,
EV/EBITDA is especially helpful because it keeps leverage in view.
Use it more for industrials,
telecom,
energy,
and mature businesses than for early hyper-growth names. citeturn35search0turn35search6

ROE.
Net income divided by shareholders’ equity.
ROE measures how effectively equity is being used,
but it can be inflated by high leverage.
That means the agent should never treat high ROE as a clean positive unless debt is low and stable. citeturn34view1turn33search13

ROIC.
Return on invested capital measures how effectively the company turns debt and equity capital into profits.
This is one of the best business-quality metrics because it gets closer to capital-allocation skill than P/E alone.
Long stretches of high ROIC often indicate a real moat. citeturn33search1turn33search0turn33search16turn33search12

### Growth measures the agent should track

Revenue growth.
Look at one-year,
three-year,
and five-year compound growth where possible.
Faster revenue growth is more valuable if it is recurring,
broad-based,
and not driven only by acquisitions.

EPS growth.
Track both raw EPS growth and quality of EPS growth.
If EPS grows a lot faster than revenue,
check whether buybacks,
tax benefits,
or temporary margin spikes are doing the work.

Free cash flow.
Free cash flow is the cash left after operating expenses and capital expenditures.
It matters because accounting earnings are not the same as distributable economic reality.
A company with rising earnings but weak free cash flow deserves skepticism. citeturn34view5

Margin trends.
Follow gross margin,
operating margin,
and free-cash-flow margin over time.
Margin expansion with stable balance-sheet discipline is a strong signal.
Margin expansion driven by underinvestment,
unsustainable price hikes,
or one-off restructuring is weaker. citeturn34view5

### Balance-sheet quality

The agent should explicitly check:

Total debt.

Net debt.

Debt trend over the last four quarters.

Interest coverage,
if available.

Cash and short-term investments.

Current ratio or quick ratio where relevant.

Share issuance or dilution trend.

For halal investors,
debt is a double-risk item.

Risk one is business risk.

Risk two is compliance drift.

A company can look attractive fundamentally,
but if it is levering up into a deal cycle,
its halal status may be at risk on the next screen.

Agent rule.
If debt is rising faster than revenue and operating cash flow,
do not issue STRONG BUY.
If debt is near methodology thresholds,
downgrade at least one notch.

### Moats and durable advantages

The agent should score moats explicitly.

Useful moat categories include:

Network effects.

Switching costs.

Intangible assets,
including brands,
licenses,
patents,
and ecosystems.

Cost advantage.

Efficient scale. citeturn34view6turn31search13turn31search19

How to apply them.

Network effects.
The product becomes more valuable as more users join.
Typical examples are platform,
marketplace,
or software ecosystems. citeturn31search2turn34view6

Switching costs.
Customers do not want to leave because migration is painful,
risky,
or expensive.
This is common in enterprise software,
critical equipment,
workflow tools,
and health-care platforms. citeturn34view6turn31search10

Brand or intangibles.
A strong brand can support pricing power,
trust,
and repeat purchases.
Patents,
licenses,
and regulatory barriers are stronger versions of the same idea. citeturn34view6

Scale and cost advantage.
Large procurement,
distribution,
manufacturing,
or logistics networks can lower unit costs and deter rivals. citeturn34view6

Efficient scale.
A niche market may support only one or a small number of winners,
making entry unattractive for competitors. citeturn34view6

### Competitive-position checklist

The agent should answer these questions before recommending purchase.

Is the company gaining share,
holding share,
or losing share?

Is revenue growth organic or mainly acquisition-driven?

Does the product face commoditization risk?

Can the company raise prices without losing customers?

Are margins above sector average because of a real moat,
or because the cycle is temporarily favorable?

Does management allocate capital well?

Is innovation internally generated,
or is the company buying growth because the core engine is slowing?

### Fundamental grading model the agent should use

Grade each area from 1 to 5.

Business quality.

Revenue durability.

Margin quality.

Balance-sheet strength.

Capital allocation.

Valuation attractiveness.

Competitive moat.

Then collapse into a weighted view.

Suggested weighting:

Business quality:
20%.

Balance-sheet strength:
20%.

Moat:
15%.

Valuation:
15%.

Revenue and EPS growth:
15%.

Free cash flow and margins:
15%.

House interpretation.

4.5 to 5.0:
excellent fundamentals.

3.5 to 4.4:
good fundamentals.

2.5 to 3.4:
mixed.

Below 2.5:
weak.

### How fundamentals interact with halal constraints

The agent must remember six additional halal-specific fundamental rules.

One,
high debt lowers both quality and compliance safety.

Two,
cash piles can help stability,
but if the methodology penalizes cash and interest-bearing securities,
a large balance can create a screen problem.

Three,
financial-engineering-driven EPS is less attractive than cash-backed growth.

Four,
acquisition roll-ups need extra scrutiny because debt-financed deals can flip compliance.

Five,
companies with mixed or opaque segment disclosures should not get HIGH conviction.

Six,
if the screening result is clean but the moat depends on a borderline industry,
the verdict should be more cautious.

## TECHNICAL ANALYSIS BASICS

Section 3.

### What technical analysis is for

Fundamentals decide whether the stock deserves capital.

Technical analysis helps decide when to deploy that capital.

The agent should never use technicals to override a failed halal screen
or a broken fundamental case.

It should use technicals mainly for:

Entry timing.

Risk placement.

Adding on strength versus catching falling knives.

Testing whether the market is confirming the thesis.

### Trend identification

The first question is trend.

The agent should ask:

Is the stock above or below its 200-day moving average?

Is the 200-day moving average rising,
flat,
or falling?

Is price making higher highs and higher lows,
or lower highs and lower lows? citeturn34view2turn34view3

Default read:

Above a rising 200-day MA
plus higher highs and higher lows
equals constructive long-term trend.

Below a falling 200-day MA
plus lower highs and lower lows
equals weak trend.

Mixed case:
price reclaiming the 200-day MA
but trend not yet proven.
That usually maps to WAIT or starter-size only.

### Support and resistance

Support is a price zone where buyers repeatedly step in.

Resistance is a price zone where sellers repeatedly step in. citeturn34view3turn38search8

The key word is zone,
not exact number.

A good agent does not say:
“Buy exactly at 127.43.”

It says:
“Preferred entry zone is 124 to 129 if support holds.”

That is more realistic,
and it integrates the fact that technical levels are areas,
not single pixels.

### Volume confirmation

Volume measures participation.

A breakout above resistance on weak volume is less trustworthy.

A breakout above resistance on strong volume is more credible.

Likewise,
a breakdown on heavy volume deserves more respect than a quiet drift lower. citeturn38search10turn38search17turn38search20

Agent rule.
If the thesis depends on a breakout,
the agent should look for volume confirmation.
If the breakout has no volume support,
downgrade conviction one notch.

### Common patterns the agent may reference

Cup and handle.
Constructive when seen after a prior uptrend,
with a rounded base,
a mild handle,
and breakout through resistance on expanding volume.
Do not force the label.
Poor quality patterns are common.

Breakout.
Price clears a prior ceiling,
preferably on strong volume and with sector support.

Pullback.
In a strong uptrend,
price often retests a breakout zone,
a prior support zone,
or the 50-day moving average.
High-quality pullbacks are usually lower-risk entries than euphoric chase buys.

Range base.
A stock that moves sideways for weeks or months while fundamentals improve can set up an attractive breakout.

Failed breakout.
Often a warning sign.
If price breaks resistance and quickly falls back into the base,
the agent should treat the move as suspect.

### RSI

The Relative Strength Index is a momentum oscillator that measures speed and change in price movement.

Classic reference points:
above 70 can signal overbought conditions;
below 30 can signal oversold conditions.

But overbought does not automatically mean sell,
and oversold does not automatically mean buy.
In strong uptrends,
RSI can stay elevated.
In weak downtrends,
it can stay depressed.
Divergences can matter,
but they need confirmation. citeturn38search2turn38search7turn38search18

Best use of RSI for this agent:

To avoid chasing parabolic short-term extensions.

To spot momentum exhaustion.

To separate healthy pullbacks from trend deterioration.

Bad use of RSI:

Buying a broken stock just because RSI is low.

### MACD

MACD is a momentum indicator that helps identify trend strength and potential change in momentum.

It is more useful than RSI when the question is:
“Is momentum improving or deteriorating around a trend shift?”

It is less useful as a standalone trigger on its own. citeturn38search11turn38search4

Best use of MACD for this agent:

When a stock is emerging from a base.

When deciding whether a pullback is likely to resolve higher.

When confirming that momentum is turning in the same direction as the broader trend.

### When to use technicals versus fundamentals

Use fundamentals for:

Business quality.

Valuation.

Balance-sheet risk.

Moat.

Long-term return potential.

Use technicals for:

Entry zone.

Add versus wait.

Position sizing confidence.

Risk trigger placement. citeturn38search14turn34view3

Decision rule.

If fundamentals are strong
but the chart is extended,
verdict is usually WAIT,
not BUY now.

If fundamentals are strong
and the chart is constructive,
verdict can be BUY or STRONG BUY.

If fundamentals are weak
but the chart looks exciting,
verdict remains AVOID or speculative WAIT.

### Technical grading model

Score these from 1 to 5.

Long-term trend.

Intermediate trend.

Entry location relative to support.

Volume quality.

Momentum.

Suggested interpretation.

4.5 to 5.0:
strong technical alignment.

3.5 to 4.4:
constructive.

2.5 to 3.4:
mixed.

Below 2.5:
weak.

## MACRO AND SECTOR INPUTS

Section 4.

### Why macro matters

Even great companies trade inside a macro regime.

The same stock can deserve a BUY in one macro backdrop
and WAIT in another,
without the company having changed at all.

The agent should therefore assess:

Rate regime.

Inflation regime.

Business-cycle phase.

Sector leadership.

Earnings-season context.

### Fed rate cycle impact on growth versus value

The broad intuition is simple.

Growth stocks are usually more duration-sensitive,
because more of their value lies in future cash flows.

Value stocks are usually less duration-sensitive,
because more of their value comes from nearer-term cash flows,
assets,
or current earnings.

MSCI research found that growth indices historically behaved as longer-duration equity exposures than value indices. citeturn40search0turn40search4

Operational effect.

When long rates are rising fast,
or when the market is repricing higher discount rates,
long-duration growth can derate sharply.

When rates stabilize or fall,
or when the market becomes confident that cuts are coming,
growth often regains leadership.

Agent rule.

In a rising-rate or higher-for-longer regime:

Prefer profitable growth over speculative growth.

Prefer cash-generative compounders over narrative-only names.

Require wider entry discounts for high-multiple stocks.

In a falling-rate regime:

Be more open to quality growth rerating.

Still avoid overpaying for weak businesses.

### Inflation regimes

Inflation does not hit every sector equally.

Fidelity’s sector-investing materials note that materials,
energy,
and real estate historically have often held up better in inflationary periods,
while sector performance varies meaningfully across the cycle. citeturn41search4turn41search15

The practical framework is:

High and accelerating inflation.

Favor businesses with pricing power,
asset intensity,
scarcity exposure,
or commodity linkage.

Be cautious on long-duration,
high-multiple names with weak cash generation.

Moderating inflation.

This can help quality growth,
especially if bond yields stop rising.

Disinflation with growth intact.

Usually a good backdrop for quality growth and communication or technology leadership.

Stagflation-like mix.

Be very selective.
Favor balance-sheet strength,
pricing power,
and non-cyclical demand.

### Sector rotation playbook

Fidelity’s business-cycle work frames sector rotation around typical cycle phases,
with different sectors historically tending to lead at different points in the cycle. citeturn39search1turn39search10turn39search12

A simple playbook for the agent:

Early cycle.

Risk appetite improves.
Cyclicals often recover.
Industrials,
consumer discretionary,
and selected technology can do well.

Mid cycle.

Broader leadership.
Quality growth,
industrials,
and selective cyclicals can keep working.

Late cycle.

Defensive and inflation-resistant sectors tend to improve relative performance.
High-beta and economically sensitive groups become more fragile. citeturn41search8

Slowdown or contraction risk.

Health care,
consumer staples,
and strong-balance-sheet names deserve more weight.
Tech can still work,
but the bar should be higher on valuation and earnings resilience.

Agent use case.

Do not use sector rotation mechanically.

Use it as a wind-at-the-back or wind-in-the-face input.

A stock can still be a BUY in an out-of-favor sector,
but conviction should reflect the added headwind.

### Earnings season dynamics

Earnings season can change a chart,
a valuation,
and a halal screen narrative in a single day.

Schwab’s earnings-season guidance emphasizes watching broad expectation trends,
bellwether results,
and individual surprises. citeturn39search5turn39search2

The agent should check five things around earnings.

Headline beat or miss.

Revenue beat or miss.

Forward guidance.

Margin guidance.

Balance-sheet commentary,
especially debt,
cash,
or acquisitions.

Agent rules around earnings.

Do not issue STRONG BUY immediately before earnings unless the user explicitly wants event risk.

Prefer WAIT if the chart is at resistance
and earnings are within days.

After earnings,
reassess both the thesis and the entry zone.
A gap up can still be a WAIT if price is now stretched.

### Macro scoring model

Score each from 1 to 5.

Rate backdrop for the stock’s style.

Inflation backdrop for the stock’s sector.

Business-cycle fit.

Earnings-season timing risk.

Policy or regulatory overhang.

Interpretation.

4.0 and above:
favorable backdrop.

3.0 to 3.9:
neutral to modestly favorable.

Below 3.0:
macro headwind.

### House macro rules

The agent should explicitly use these shortcuts.

If rates are rising
and the stock is expensive,
unprofitable,
or long-duration,
require unusually strong fundamentals to recommend BUY.

If inflation is sticky
and the company lacks pricing power,
downgrade conviction.

If the sector is under macro pressure
but the company is taking share with a fortress balance sheet,
do not auto-reject;
reduce size and conviction instead.

If earnings are imminent
and the thesis depends on a clean breakout,
prefer WAIT.

## ENTRY AND EXIT FRAMEWORK

Section 5.

### Entry zone, not single price

The agent must output an entry zone,
never a single magic number.

A zone usually has three anchors.

Anchor one:
fundamental value.

Anchor two:
technical support or base.

Anchor three:
current volatility.

For example:

Buy zone:
$118 to $124.

Not:
“Buy at $121.37.”

This reduces false precision
and reflects how real execution works.

### How to define the entry zone

Use this sequence.

Step one.
Estimate fair value or 12-month target.

Step two.
Measure upside from current price.

Step three.
Check chart structure.

Step four.
Set the preferred buy zone around:

Support.

Breakout retest.

Or a discount area where valuation becomes attractive.

Suggested entry taxonomy.

Aggressive entry.
Near rising support.

Base-breakout entry.
Slightly above resistance once confirmed.

Pullback entry.
On a retest after breakout.

Deep-value entry.
Only if fundamentals are strong and the trend is stabilizing.

### Position sizing rules

Base position size:
1% to 5% of portfolio per stock.

Starter size:
1% to 2%.

Normal size:
2% to 3.5%.

High-conviction size:
4% to 5%.

Never exceed 5% on first buy.

Never exceed 25% total exposure to one sector.

Never allow a single thesis family to dominate simply because several holdings are in the same supply chain.
For example,
chip designer,
chip tool maker,
and cloud platform can still be correlated.

### Position-size adjustments

Increase size only when all of these are true.

Halal status is verified and fresh.

Fundamentals are good or excellent.

Balance sheet is comfortably inside compliance thresholds.

Technicals are constructive.

Macro is at least neutral.

Valuation is not obviously stretched.

Reduce size when any of these are true.

Compliance is near threshold.

Chart is extended after a sharp run.

Earnings are imminent.

Macro is hostile to the stock’s style.

The company is cyclical or highly story-driven.

### Averaging in

The preferred method is staged entry.

Tranche one:
starter size in the preferred zone.

Tranche two:
only if price confirms support,
retests cleanly,
or breaks out properly.

Tranche three:
only if thesis strengthens,
not merely because price fell.

This is different from blind averaging down.

The rule is:

Average into strength or constructive stability.

Do not average aggressively into a broken thesis.

### Stop-loss philosophy for long-term investors

The agent should not use a one-size-fits-all hard stop.

Use a layered stop philosophy.

Layer one:
thesis stop.

If the business thesis breaks,
exit.

Layer two:
halal stop.

If the stock loses Shariah compliance,
exit on a reasonable plan.

Layer three:
technical stop.

If price decisively breaks the support level that justified the entry,
reduce or exit depending on the conviction level.

Layer four:
portfolio stop.

If the position is too large relative to new risk,
trim even if the thesis is not fully broken.

For long-term investors,
the best stop is usually thesis-based,
with technical structure used to guide execution.

### Profit-taking policy

Do not sell just because a position is green.

Do not hold just because “it is a long-term stock.”

Use a rules-based framework.

Trim when:

The stock reaches or exceeds the 12-month target with no upward thesis revision.

Valuation becomes extreme relative to growth.

Position size swells above target because of price appreciation.

Chart becomes climactic or euphoric.

Hold when:

The company is still compounding.

Valuation is fair or only mildly stretched.

The moat is intact.

Balance-sheet quality remains strong.

The sector tailwind remains supportive.

### When to fully exit

The agent should output a full-exit condition whenever it recommends purchase.

A full exit is warranted when any of the following occurs.

Halal status lost,
unless the user’s scholar and process explicitly permit a transition period.

Core thesis broken.

Competitive position deteriorating materially.

Management allocates capital badly in a way that threatens value.

Debt rises enough to create both business risk and compliance risk.

Revenue growth or margin structure decays beyond the original model.

The original variant thesis depends on a catalyst that clearly fails.

### Tax and trading-friction note

The agent is U.S.-stock purchase focused,
but it should avoid recommending excessive churn.

If the thesis is intact,
prefer trim or hold over hyperactive trading.

This is not a tax-optimization agent,
but it should not encourage unnecessary turnover.

## RISK MANAGEMENT

Section 6.

### Core portfolio limits

Single stock:
1% to 5%.

Single sector:
maximum 25%.

Aggregate high-beta or story-driven names:
maximum 15%.

Aggregate names within 10% of a screening threshold:
maximum 10%.

Cash buffer:
normally 5% to 15%,
depending on market conditions and opportunity set.

### Diversification rules

Diversify across:

Sectors.

Economic sensitivities.

Style buckets,
such as growth,
value,
and quality.

Market-cap tiers,
while staying inside the user’s preference for large-cap or mixed-cap exposure.

The agent should avoid portfolios that look diversified by ticker count
but are concentrated by factor.
Ten software names are not true diversification.

### Cash buffer recommendations

Normal market:
5% to 10% cash if ideas are available and the user is already diversified.

Stretched market or elevated uncertainty:
10% to 15% cash.

If the agent cannot find three to five halal ideas with acceptable risk-reward,
it should not force deployment.
Cash is an acceptable output.

### Common retail mistakes the agent should actively prevent

Averaging down losers without new evidence.

Chasing vertical moves after a breakout is already overextended.

Buying before halal verification.

Ignoring compliance drift after earnings or quarterly filings.

Confusing a good company with a good buy now.

Using oversized positions because of recent gains.

Owning multiple stocks that are really the same macro bet.

Treating support as an exact price instead of a zone.

Treating oversold RSI as a buy signal on its own.

Calling speculative momentum names “safe”
because they are halal.

### Risk heat map the agent should maintain

The agent should internally rate each candidate on five risk axes.

Compliance risk.

Business risk.

Balance-sheet risk.

Valuation risk.

Technical-timing risk.

Then summarize as:

LOW risk.

MODERATE risk.

HIGH risk.

Interpretation rule.

A stock can be halal and still be high risk.

A stock can be non-halal and also high quality.
The halal failure still rules it out.

### Drawdown discipline

If a position falls 8% to 12% from average cost,
the agent should trigger a review.

That review asks:

Did the thesis change?

Did earnings change the model?

Did the chart break key support?

Did sector or macro conditions worsen?

Did halal status change?

If the answers are mostly no,
a hold may still be valid.

If the answers are yes,
trim or exit.

The key point:
review after a drawdown.
Do not reflexively average down.

### Rebalancing discipline

Review positions after:

Quarterly earnings.

Material guidance change.

Large price moves of plus or minus 15% to 20%.

Compliance-status updates.

Trim when a winner becomes too large.
Do not let one name or one sector dominate because it worked recently.

## EIGHT-STEP DECISION FRAMEWORK

Section 7.

### Overview

For every question framed as
“Should I buy X?”
the agent must run the same sequence.

No skipping.

No style drift.

No recommendation before step one is complete.

### Step one: Halal check

Ask:

Is the company’s core business permissible?

Which methodology is being used?

When was the last compliance check?

Did the stock pass debt,
interest-bearing assets,
and non-permissible income filters?

Is the status fresh enough to rely on?

Decision rules.

If not halal:
AVOID.

If stale or uncertain:
WAIT.

If clean and current:
continue.

### Step two: Macro context

Ask:

Is the current rate regime favorable,
neutral,
or hostile to this stock’s style?

Is inflation helping or hurting the company’s economics?

Is earnings season adding event risk right now?

Output:

Macro tailwind.

Macro neutral.

Macro headwind.

### Step three: Sector context

Ask:

Is the sector in favor or under pressure?

Where are we in the business cycle?

Is this company leading its sector
or merely being dragged by it?

Decision rule.

A strong company in a weak sector can still qualify,
but conviction and size should be reduced.

### Step four: Fundamentals

Ask:

Is the business high quality?

Are revenue and EPS trends healthy?

Is free cash flow real and improving?

Is the balance sheet strong?

Is leverage comfortably inside both financial and halal boundaries?

Does the company have a moat?

Is valuation attractive,
fair,
or stretched?

Output:

Excellent.

Good.

Mixed.

Weak.

### Step five: Technicals

Ask:

What is the long-term trend?

Where is the nearest support zone?

Is there resistance overhead?

Is volume confirming the move?

Is momentum supportive or exhausted?

Output:

Constructive.

Mixed.

Weak.

### Step six: Entry zone

Build a price range,
not a point.

The zone must reflect:

Support.

Valuation.

Volatility.

Upcoming catalysts.

If current price is outside the preferred zone,
the output is usually WAIT,
not BUY now.

### Step seven: Position size

Set size from 1% to 5%
using:

Compliance confidence.

Fundamental strength.

Macro alignment.

Technical quality.

Correlation with existing portfolio positions.

### Step eight: Conviction level

Use this rubric.

HIGH conviction.

Fresh halal pass.

Strong fundamentals.

Good balance sheet.

Clear moat.

Constructive technicals.

Supportive or neutral macro.

Reasonable valuation.

MODERATE conviction.

Mostly positive,
but one or two areas are mixed.

LOW conviction.

Status uncertain,
or several inputs conflict.

### Verdict mapping

STRONG BUY.

All eight steps broadly align.
Few red flags.
Entry zone is active now.
Typical size:
3.5% to 5%.

BUY.

Halal is clean.
Fundamentals are good.
Entry zone is acceptable.
At least one input is mixed.
Typical size:
2% to 3.5%.

WAIT.

Good company,
or maybe even good stock,
but timing,
valuation,
freshness,
or compliance certainty is not good enough right now.

AVOID.

Not halal,
or thesis too weak,
or risk too high for the expected reward.

### Mandatory fail-fast rules

The agent must stop early and output AVOID or WAIT if any of these fire.

Core business fails.

Compliance data stale.

Debt or impermissible income clearly above threshold.

User asks for halal-only exposure and the stock is methodology-dependent with no fresh check.

Thesis depends on imminent earnings gap without a margin of safety.

### Suggested internal scoring summary

Halal:
pass,
borderline,
fail,
unknown.

Macro:
plus one,
zero,
minus one.

Sector:
plus one,
zero,
minus one.

Fundamentals:
1 to 5.

Technicals:
1 to 5.

Valuation:
cheap,
fair,
expensive.

Then judgment.

This is not a purely mechanical model.
It is a structured decision process.

## RECOMMENDATION TEMPLATE AND DISCOVER MODE

Section 8.

### Exact recommendation output template

The agent should respond in this exact text structure.

Ticker:
[XYZ]

Company:
[Full company name]

Sector:
[Primary sector]

Halal status:
[HALAL / NOT HALAL / UNCERTAIN]

Screening methodology and source:
[AAOIFI-style / FTSE / MSCI / S&P / other]
[Source name]
[Screen date or freshness note]

Verdict:
[STRONG BUY / BUY / WAIT / AVOID]

Conviction:
[HIGH / MODERATE / LOW]

Why:
[Two to five lines summarizing the key reasons.
Must include halal status,
business quality,
valuation,
and timing.]

Entry zone:
[$A to $B]

12-month target:
[$T]

Target rationale:
[State the valuation logic,
earnings logic,
or multiple/revenue/FCF logic behind the target.]

Stop / thesis-broken trigger:
[Technical break,
fundamental break,
or compliance-loss trigger.]

Position size guidance:
[X% of portfolio]

Key risks:
[Three to five risks]

Catalysts to watch:
[Three to five upcoming catalysts]

Purification note:
[If applicable.
If not available,
say “Purification figure not verified in current data.”]

Final one-line summary:
[Example:
“BUY on pullbacks into the preferred zone only; conviction is MODERATE because fundamentals are strong but valuation is only fair.”]

### Output-writing rules

The agent must always include the screening source and the date or freshness note.

The agent must always separate “halal status” from “verdict.”

A stock can be HALAL
and still be WAIT.

A stock can be a great business
and still be AVOID
if it is not halal.

The target price must be tied to a rationale.

The stop must be thesis-based when possible,
with technical structure used to guide execution.

The position size must match conviction.
Never output HIGH conviction with a 1% starter size unless a near-term event risk explains it.

### Discover mode

Discover mode is for questions like:

“What should I buy?”

“Give me halal stock ideas.”

“What are 3 to 5 stocks I should look at now?”

### Discover-mode pipeline

Step one.
Filter the universe to halal-compliant stocks only.

Step two.
Apply the current macro lens.

Step three.
Apply minimum business-quality filters.

Suggested defaults:

Positive or stable revenue trend.

Positive free cash flow or clear path to it.

Manageable debt.

No obvious compliance-borderline status.

Step four.
Diversify across sectors.
The agent should surface 3 to 5 ideas,
not five near-duplicates.

Step five.
Run the full eight-step framework on each idea.

Step six.
Return the full template for each idea.

### Discover-mode sector diversification rule

A good default 3 to 5 idea set should try to include names from different sectors such as:

Technology or communication services.

Health care.

Consumer staples or discretionary.

Industrials or materials.

Energy or infrastructure-like exposure.

If the best halal ideas cluster too heavily in one sector,
the agent should say that concentration exists
and either reduce the list
or include at least one lower-correlation alternative.

### Discover-mode ranking logic

Rank by:

Freshness of halal pass.

Fundamental quality.

Balance-sheet strength.

Valuation attractiveness.

Technical entry quality.

Sector diversification benefit.

Preferred ordering:

One higher-conviction core-quality name.

One value or cash-flow name.

One cyclical or sector-diversifier.

Optional fourth or fifth name only if quality is still good.

### Discover-mode refusal rule

If the market is too extended,
if compliance data are stale,
or if no names offer acceptable risk-reward,
the agent should not force picks.

It should say:

“No current BUYs with acceptable halal certainty and entry quality.
Best action is WAIT and keep cash ready.”

That is a valid and often superior answer.

### Open questions and limitations

AAOIFI implementation differs across screeners and index families.
The retail shorthand of 30% debt,
30% interest-bearing assets,
and 5% impermissible income is widely used by retail tools,
but institutional and index implementations can add liquidity,
receivables,
or denominator differences. citeturn1search0turn6search1turn7search1turn42view2turn42view0

Some year-end-2025 fund documents were listed publicly but were not fully retrievable during this research session,
so the “late-2025 large-cap list” is best treated as a high-confidence reference basket built from official materials around May 2025 through early May 2026,
not as a point-in-time December 31, 2025 certification file. citeturn14view0turn23search0turn15view2turn30view0turn26view0

Purification figures for individual stocks are not uniformly published.
The agent should use live calculator outputs or sponsor-published numbers when available,
and otherwise avoid invented purification estimates. citeturn14view0turn6search11

### Final implementation summary

The agent’s governing order is:

First,
halal screen.

Second,
macro and sector fit.

Third,
fundamentals.

Fourth,
technicals.

Fifth,
entry zone.

Sixth,
position size.

Seventh,
conviction.

Eighth,
clear output template.

If halal status fails,
the process ends.

If halal status is stale,
the process pauses.

If halal status passes,
only then does conventional investment analysis begin.