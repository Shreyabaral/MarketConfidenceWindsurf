import os
import pandas as pd
import numpy as np
import yfinance as yf
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import openai
from dotenv import load_dotenv
import random
import copy

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configure OpenAI API key
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# MSCI World Index ticker symbol
MSCI_WORLD_TICKER = "URTH"  # ETF that tracks MSCI World Index

# Function to generate mock market data
def generate_mock_market_data(start_date, end_date):
    """Generate mock market data for a specified time period"""
    # Calculate number of days between start and end dates
    days = (end_date - start_date).days + 1
    
    # Generate a sequence of dates
    dates = [start_date + timedelta(days=i) for i in range(days)]
    
    # Starting price
    base_price = 100.0
    
    # Generate mock prices
    formatted_data = []
    current_price = base_price
    
    for i, date in enumerate(dates):
        # Skip weekends
        if date.weekday() >= 5:  # Saturday=5, Sunday=6
            continue
            
        # Random daily change between -2% and 2%
        daily_change = random.uniform(-0.02, 0.02)
        
        # Add some trends and volatility
        if i > 0 and i % 20 == 0:
            # Create a small trend shift every 20 days
            trend_shift = random.uniform(-0.05, 0.05)
            current_price *= (1 + trend_shift)
        
        # Apply daily change
        current_price *= (1 + daily_change)
        
        # Calculate other price points based on the close price
        open_price = current_price * random.uniform(0.99, 1.01)
        high_price = max(open_price, current_price) * random.uniform(1.001, 1.01)
        low_price = min(open_price, current_price) * random.uniform(0.99, 0.999)
        volume = int(random.uniform(100000, 1000000))
        
        # Add data point
        formatted_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'close': round(current_price, 2),
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'volume': volume
        })
    
    return formatted_data

# Function to generate market data with a specific event impact
def generate_event_impact_data(event, start_date, end_date, impact_date, severity):
    """Generate mock market data with an event impact"""
    # Get base data
    data = generate_mock_market_data(start_date, end_date)
    
    # Find the index closest to the impact date
    impact_date_str = impact_date.strftime('%Y-%m-%d')
    impact_idx = 0
    
    for i, item in enumerate(data):
        if item['date'] >= impact_date_str:
            impact_idx = i
            break
    
    # Apply impact effect - a sudden drop followed by gradual recovery
    impact_factor = max(0.05, min(0.40, severity))  # Limit between 5% and 40%
    recovery_days = int(severity * 100)  # More severe = longer recovery
    
    # Apply market crash
    for i in range(impact_idx, min(impact_idx + 10, len(data))):
        drop_factor = impact_factor * (10 - (i - impact_idx)) / 10
        data[i]['close'] *= (1 - drop_factor)
        data[i]['open'] *= (1 - drop_factor)
        data[i]['high'] *= (1 - drop_factor)
        data[i]['low'] *= (1 - drop_factor)
        data[i]['volume'] = int(data[i]['volume'] * (1 + drop_factor * 5))  # Higher volume during crash
    
    # Apply recovery
    pre_crash_price = data[impact_idx - 1]['close'] if impact_idx > 0 else data[0]['close']
    post_crash_price = data[min(impact_idx + 9, len(data) - 1)]['close']
    price_gap = pre_crash_price - post_crash_price
    
    for i in range(impact_idx + 10, min(impact_idx + 10 + recovery_days, len(data))):
        recovery_progress = (i - (impact_idx + 10)) / recovery_days
        recovery_factor = min(1.0, recovery_progress * 1.5)  # Can accelerate recovery a bit
        
        recovery_amount = price_gap * recovery_factor
        data[i]['close'] = post_crash_price + recovery_amount
        data[i]['open'] = data[i]['close'] * random.uniform(0.99, 1.01)
        data[i]['high'] = data[i]['close'] * random.uniform(1.0, 1.02)
        data[i]['low'] = data[i]['close'] * random.uniform(0.98, 1.0)
    
    # Round all the price values
    for item in data:
        item['close'] = round(item['close'], 2)
        item['open'] = round(item['open'], 2)
        item['high'] = round(item['high'], 2)
        item['low'] = round(item['low'], 2)
    
    return data, recovery_days

def simulate_investment_strategy(event_data, impact_idx, strategy):
    """
    Simulate the performance of different investment strategies during a market event.
    
    Args:
        event_data: List of market data points with the event impact
        impact_idx: Index of the event impact start
        strategy: String indicating the strategy ('withdraw', 'add', or 'hold')
    
    Returns:
        Modified data showing portfolio value over time
    """
    # Create a deep copy of the data to avoid modifying the original
    data = copy.deepcopy(event_data)
    
    # Calculate the event midpoint (approximately when the market has dropped halfway)
    mid_event_idx = impact_idx + 5  # Assuming event impact occurs over 10 days
    
    # Initialize portfolio with 100 units and track value
    initial_units = 100
    units = initial_units
    
    # Calculate portfolio value for each day and add to data
    for i in range(len(data)):
        if i == mid_event_idx:
            # Apply the selected strategy at the mid-point of the event
            if strategy == 'withdraw':
                # Withdraw 20% (sell 20% of holdings)
                sell_units = units * 0.2
                units -= sell_units
            elif strategy == 'add':
                # Add 20% (buy 20% more units at current price)
                current_price = data[i]['close']
                add_units = units * 0.2
                units += add_units
            # For 'hold' strategy, do nothing
        
        # Calculate portfolio value based on current units and price
        data[i]['portfolio_value'] = units * data[i]['close']
    
    return data

@app.route('/api/market-data', methods=['GET'])
def get_market_data():
    """Fetch MSCI World Index data for the default time period (5 years)"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5*365)  # 5 years of data
        
        # Generate mock data instead of fetching from Yahoo Finance
        formatted_data = generate_mock_market_data(start_date, end_date)
        
        return jsonify({
            'status': 'success',
            'data': formatted_data
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/analyze-event', methods=['POST'])
def analyze_event():
    """Analyze a global event's impact on the market and adjust the timeframe"""
    try:
        # Get event details from request
        data = request.json
        event = data.get('event')
        
        if not event:
            return jsonify({
                'status': 'error',
                'message': 'Event description is required'
            }), 400
        
        # Mock events with predefined time periods and severity
        events_map = {
            'covid': {'name': 'COVID-19 Pandemic', 'date': datetime(2020, 2, 15), 'severity': 0.35},
            'financial crisis': {'name': '2008 Financial Crisis', 'date': datetime(2008, 9, 15), 'severity': 0.40},
            'dot com': {'name': 'Dot-com Bubble Burst', 'date': datetime(2000, 3, 10), 'severity': 0.30},
            'brexit': {'name': 'Brexit Referendum', 'date': datetime(2016, 6, 23), 'severity': 0.15},
            'ukraine': {'name': 'Russia-Ukraine Conflict', 'date': datetime(2022, 2, 24), 'severity': 0.12},
            'inflation': {'name': 'Inflation Spike', 'date': datetime(2021, 10, 1), 'severity': 0.10}
        }
        
        # Determine which event was mentioned (simple keyword matching)
        matched_event = None
        event_lower = event.lower()
        
        for key, event_info in events_map.items():
            if key in event_lower:
                matched_event = event_info
                break
        
        # If no specific event matched, use a generic one
        if not matched_event:
            # Default to a moderately severe event at a random date in the past 10 years
            years_back = random.randint(1, 10)
            random_date = datetime.now() - timedelta(days=365 * years_back)
            matched_event = {
                'name': f'Market Event: {event}',
                'date': random_date,
                'severity': random.uniform(0.10, 0.25)
            }
        
        # Define the time period
        event_date = matched_event['date']
        start_date = event_date - timedelta(days=180)  # 6 months before
        end_date = min(event_date + timedelta(days=730), datetime.now())  # Up to 2 years after or today
        
        # Generate mock data with the event impact
        formatted_data, recovery_days = generate_event_impact_data(
            event, 
            start_date, 
            end_date, 
            event_date, 
            matched_event['severity']
        )
        
        # Create a mock analysis
        recovery_time = f"{recovery_days} trading days (approximately {round(recovery_days/20, 1)} months)"
        percent_decline = f"{round(matched_event['severity'] * 100, 1)}%"
        
        analysis = {
            'summary': f"The {matched_event['name']} had a significant impact on global markets. "
                      f"Starting around {event_date.strftime('%B %Y')}, markets experienced a sharp decline "
                      f"of approximately {percent_decline} over a period of several days to weeks. "
                      f"This was driven by investor uncertainty, risk aversion, and liquidity concerns. "
                      f"The markets initially showed high volatility with larger than average trading volumes. "
                      f"Recovery took place gradually over the following months, with a complete return to "
                      f"pre-event levels taking approximately {recovery_days/20:.1f} months. "
                      f"This event demonstrated how external shocks can rapidly impact global financial markets "
                      f"and the resilience of markets to recover over time.",
            'recovery_time': recovery_time,
            'percent_decline': percent_decline,
            'key_insight': f"The market took approximately {recovery_days/20:.1f} months to fully recover from this event, demonstrating the resilience of financial markets to external shocks over medium-term horizons."
        }
        
        return jsonify({
            'status': 'success',
            'data': formatted_data,
            'analysis': analysis,
            'timeFrame': {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d')
            }
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/simulate-strategies', methods=['POST'])
def simulate_strategies():
    """Simulate different investment strategies during a market event"""
    try:
        # Get event details from request
        data = request.json
        event = data.get('event')
        
        if not event:
            return jsonify({
                'status': 'error',
                'message': 'Event description is required'
            }), 400
        
        # Mock events with predefined time periods and severity (same as in analyze_event)
        events_map = {
            'covid': {'name': 'COVID-19 Pandemic', 'date': datetime(2020, 2, 15), 'severity': 0.35},
            'financial crisis': {'name': '2008 Financial Crisis', 'date': datetime(2008, 9, 15), 'severity': 0.40},
            'dot com': {'name': 'Dot-com Bubble Burst', 'date': datetime(2000, 3, 10), 'severity': 0.30},
            'brexit': {'name': 'Brexit Referendum', 'date': datetime(2016, 6, 23), 'severity': 0.15},
            'ukraine': {'name': 'Russia-Ukraine Conflict', 'date': datetime(2022, 2, 24), 'severity': 0.12},
            'inflation': {'name': 'Inflation Spike', 'date': datetime(2021, 10, 1), 'severity': 0.10}
        }
        
        # Determine which event was mentioned (simple keyword matching)
        matched_event = None
        event_lower = event.lower()
        
        for key, event_info in events_map.items():
            if key in event_lower:
                matched_event = event_info
                break
        
        # If no specific event matched, use a generic one
        if not matched_event:
            # Default to a moderately severe event at a random date in the past 10 years
            years_back = random.randint(1, 10)
            random_date = datetime.now() - timedelta(days=365 * years_back)
            matched_event = {
                'name': f'Market Event: {event}',
                'date': random_date,
                'severity': random.uniform(0.10, 0.25)
            }
        
        # Define the time period
        event_date = matched_event['date']
        start_date = event_date - timedelta(days=180)  # 6 months before
        end_date = min(event_date + timedelta(days=730), datetime.now())  # Up to 2 years after or today
        
        # Generate base event impact data
        base_data, recovery_days = generate_event_impact_data(
            event, 
            start_date, 
            end_date, 
            event_date, 
            matched_event['severity']
        )
        
        # Find the index closest to the impact date
        impact_date_str = event_date.strftime('%Y-%m-%d')
        impact_idx = 0
        
        for i, item in enumerate(base_data):
            if item['date'] >= impact_date_str:
                impact_idx = i
                break
        
        # Simulate different strategies
        withdraw_data = simulate_investment_strategy(base_data, impact_idx, 'withdraw')
        add_data = simulate_investment_strategy(base_data, impact_idx, 'add')
        hold_data = simulate_investment_strategy(base_data, impact_idx, 'hold')
        
        # Create summary of results
        end_idx = len(base_data) - 1
        initial_value = hold_data[0]['portfolio_value']
        final_values = {
            'withdraw': withdraw_data[end_idx]['portfolio_value'],
            'add': add_data[end_idx]['portfolio_value'],
            'hold': hold_data[end_idx]['portfolio_value']
        }
        
        # Calculate percentage changes
        percent_changes = {
            strategy: round(((value - initial_value) / initial_value) * 100, 2)
            for strategy, value in final_values.items()
        }
        
        # Determine best strategy based on final value
        best_strategy = max(final_values, key=final_values.get)
        
        results_summary = {
            'initialValue': round(initial_value, 2),
            'finalValues': {k: round(v, 2) for k, v in final_values.items()},
            'percentChanges': percent_changes,
            'bestStrategy': best_strategy,
            'eventName': matched_event['name'],
            'eventDate': event_date.strftime('%Y-%m-%d'),
            'eventSeverity': f"{round(matched_event['severity'] * 100, 1)}%"
        }
        
        return jsonify({
            'status': 'success',
            'strategies': {
                'withdraw': withdraw_data,
                'add': add_data, 
                'hold': hold_data
            },
            'summary': results_summary,
            'timeFrame': {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'eventDate': event_date.strftime('%Y-%m-%d')
            }
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/simulate-portfolio', methods=['POST'])
def simulate_portfolio():
    """Simulate portfolio performance with different strategies during market events"""
    try:
        # Get request data
        data = request.json
        event = data.get('event', 'covid')
        total_investment = data.get('investment', 10000)
        
        # Map event names to dates and impact parameters
        event_parameters = {
            'covid': {
                'start_date': datetime(2020, 2, 1),
                'end_date': datetime(2020, 6, 1),
                'impact_date': datetime(2020, 3, 1),
                'severity': 0.3
            },
            'financial_crisis': {
                'start_date': datetime(2008, 8, 1),
                'end_date': datetime(2008, 12, 31),
                'impact_date': datetime(2008, 9, 15),
                'severity': 0.35
            },
            'dot_com': {
                'start_date': datetime(2000, 3, 1),
                'end_date': datetime(2000, 7, 31),
                'impact_date': datetime(2000, 4, 14),
                'severity': 0.25
            },
            'inflation': {
                'start_date': datetime(2022, 1, 1),
                'end_date': datetime(2022, 5, 31),
                'impact_date': datetime(2022, 2, 15),
                'severity': 0.2
            }
        }
        
        # Use default event if the requested one is not defined
        event_params = event_parameters.get(event, event_parameters['covid'])
        
        # Generate market data with event impact
        market_data, recovery_days = generate_event_impact_data(
            event, 
            event_params['start_date'], 
            event_params['end_date'],
            event_params['impact_date'],
            event_params['severity']
        )
        
        # Calculate impact index (where the event impact starts)
        impact_date_str = event_params['impact_date'].strftime('%Y-%m-%d')
        impact_idx = 0
        for i, item in enumerate(market_data):
            if item['date'] >= impact_date_str:
                impact_idx = i
                break
        
        # Simulate different strategies
        strategies_data = []
        
        # Initial portfolio value based on the investment amount
        portfolio_value = total_investment
        initial_units = portfolio_value / market_data[0]['close']
        
        # Calculate the event midpoint (approximately when the market has dropped halfway)
        mid_event_idx = impact_idx + 5  # Assuming event impact occurs over 10 days
        
        # Simulate for each day in the data
        for i, day_data in enumerate(market_data):
            # Base portfolio values for each strategy
            day_price = day_data['close']
            
            # Units for each strategy
            units_withdraw = initial_units
            units_add = initial_units
            units_hold = initial_units
            
            # Apply strategies at the mid-point of the event
            if i == mid_event_idx:
                # Withdraw 20% strategy (sell 20% of holdings)
                units_withdraw = initial_units * 0.8
                
                # Add 20% strategy (buy 20% more units at current price)
                additional_units = (initial_units * 0.2) * (market_data[0]['close'] / day_price)
                units_add = initial_units + additional_units
            
            # Calculate portfolio values for each strategy
            value_withdraw = units_withdraw * day_price
            value_add = units_add * day_price
            value_hold = units_hold * day_price
            
            # Add to the dataset
            strategies_data.append({
                'date': day_data['date'],
                'withdraw': round(value_withdraw, 2),
                'add': round(value_add, 2),
                'hold': round(value_hold, 2),
                'marketPrice': day_price
            })
        
        return jsonify({
            'status': 'success',
            'event': event,
            'strategies': strategies_data,
            'eventInfo': {
                'name': event.replace('_', ' ').title(),
                'impactDate': impact_date_str,
                'recoveryDays': recovery_days
            }
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/validate-symbol', methods=['GET'])
def validate_symbol():
    """Validate a stock symbol using Yahoo Finance API"""
    try:
        symbol = request.args.get('symbol')
        
        if not symbol:
            return jsonify({
                'status': 'error',
                'message': 'No symbol provided'
            }), 400
        
        # Try to get ticker info from Yahoo Finance
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Check if we got valid data
            if 'longName' in info:
                return jsonify({
                    'status': 'success',
                    'name': info.get('longName', info.get('shortName', symbol)),
                    'symbol': symbol
                })
            else:
                # Return mock data for demo purposes
                return jsonify({
                    'status': 'success',
                    'name': f"{symbol.upper()} - Mock Data",
                    'symbol': symbol.upper()
                })
        except Exception as e:
            # Return mock data if Yahoo Finance fails
            return jsonify({
                'status': 'success',
                'name': f"{symbol.upper()} - Mock Data",
                'symbol': symbol.upper()
            })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/asset-data', methods=['GET'])
def get_asset_data():
    """Get data for a specific asset (stock, ETF, fund)"""
    try:
        symbol = request.args.get('symbol')
        period = request.args.get('period', '1y')  # Default to 1 year
        
        if not symbol:
            return jsonify({
                'status': 'error',
                'message': 'No symbol provided'
            }), 400
        
        # Try to get historical data from Yahoo Finance
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            # Format the data for frontend
            formatted_data = []
            for date, row in hist.iterrows():
                formatted_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'close': round(float(row['Close']), 2),
                    'open': round(float(row['Open']), 2),
                    'high': round(float(row['High']), 2),
                    'low': round(float(row['Low']), 2),
                    'volume': int(row['Volume'])
                })
            
            # Get asset info
            info = ticker.info
            asset_info = {
                'name': info.get('longName', info.get('shortName', symbol)),
                'symbol': symbol,
                'currency': info.get('currency', 'USD'),
                'asset_type': 'Stock'  # Default to Stock
            }
            
            # Try to determine asset type
            if 'quoteType' in info:
                quote_type = info['quoteType']
                if quote_type == 'ETF':
                    asset_info['asset_type'] = 'ETF'
                elif quote_type == 'MUTUALFUND':
                    asset_info['asset_type'] = 'Fund'
            
            return jsonify({
                'status': 'success',
                'data': formatted_data,
                'info': asset_info
            })
            
        except Exception as e:
            # If Yahoo Finance fails, return mock data
            mock_data = generate_mock_asset_data(symbol, period)
            
            return jsonify({
                'status': 'success',
                'data': mock_data,
                'info': {
                    'name': f'{symbol} Asset',
                    'symbol': symbol,
                    'currency': 'USD',
                    'asset_type': 'Stock'
                },
                'note': 'Using mock data due to data retrieval issues'
            })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def generate_mock_asset_data(symbol, period):
    """Generate mock data for an asset"""
    end_date = datetime.now()
    
    # Determine start_date based on period
    if period == '1d':
        start_date = end_date - timedelta(days=1)
        interval = timedelta(minutes=30)
    elif period == '5d':
        start_date = end_date - timedelta(days=5)
        interval = timedelta(hours=2)
    elif period == '1mo':
        start_date = end_date - timedelta(days=30)
        interval = timedelta(days=1)
    elif period == '3mo':
        start_date = end_date - timedelta(days=90)
        interval = timedelta(days=1)
    elif period == '6mo':
        start_date = end_date - timedelta(days=180)
        interval = timedelta(days=1)
    elif period == '1y':
        start_date = end_date - timedelta(days=365)
        interval = timedelta(days=1)
    elif period == '2y':
        start_date = end_date - timedelta(days=365*2)
        interval = timedelta(days=2)
    elif period == '5y':
        start_date = end_date - timedelta(days=365*5)
        interval = timedelta(days=5)
    else:
        start_date = end_date - timedelta(days=365)
        interval = timedelta(days=1)
    
    # Generate dates
    dates = []
    current_date = start_date
    while current_date <= end_date:
        # Skip weekends
        if current_date.weekday() < 5:  # Monday to Friday
            dates.append(current_date)
        current_date += interval
    
    # Base price and trend factor based on symbol letters
    symbol_val = sum(ord(c) for c in symbol.upper())
    base_price = 50 + (symbol_val % 150)  # Price between 50 and 200
    trend_factor = ((symbol_val % 10) - 5) / 100  # Between -0.05 and 0.05
    
    # Generate mock data
    formatted_data = []
    current_price = base_price
    
    for i, date in enumerate(dates):
        # Apply trend over time
        current_price *= (1 + trend_factor)
        
        # Add random daily fluctuation
        daily_change = random.uniform(-0.02, 0.02)
        current_price *= (1 + daily_change)
        
        # Other price points
        open_price = current_price * random.uniform(0.99, 1.01)
        high_price = max(open_price, current_price) * random.uniform(1.001, 1.01)
        low_price = min(open_price, current_price) * random.uniform(0.99, 0.999)
        volume = int(random.uniform(100000, 1000000))
        
        formatted_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'close': round(current_price, 2),
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'volume': volume
        })
    
    return formatted_data

def get_event_time_period(event):
    """Use OpenAI to determine the appropriate time period for a global event"""
    # With mock data, we don't need this function any more
    pass

def analyze_market_impact(event, market_data, time_period):
    """Generate an analysis of the event's impact on the market"""
    # With mock data, we don't need this function any more
    pass

if __name__ == '__main__':
    app.run(debug=True, port=5002)
