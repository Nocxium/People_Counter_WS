import paho.mqtt.client as mqtt
import mysql.connector
from mysql.connector import Error
import json
import ssl

try:
    connection = mysql.connector.connect(
        host='xxx.xxx.xx.xxx',
        port=3306,
        database='emqx_data',
        user='xxxxx',
        password='xxxxx'
    )
except Error as e:
    print(f"Error connecting to MySQL database: {e}")
    exit(1)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected successfully.")
        client.subscribe("LNU_Project/people_counter/data", qos=1)
        client.subscribe("LNU_Project/people_counter/notifications", qos=1)
    else:
        print("Connection failed with code %d." % rc)

def on_message(client, userdata, message):
    print("Received message on "+message.topic)
    payload = message.payload.decode("utf-8")
    print(payload)
    mqtt_data = json.loads(payload)

    if message.topic == "LNU_Project/people_counter/data":
        identification = mqtt_data["identification"]
        timestamp = mqtt_data["timestamp"]
        ins = mqtt_data["ins"]
        outs = mqtt_data["outs"]
        
        try:
            cursor = connection.cursor()
            sql_insert_query = """
                INSERT INTO emqx_messeges (client_id, timestamp, ins, outs) 
                VALUES (%s, FROM_UNIXTIME(%s), %s, %s)
            """
            cursor.execute(sql_insert_query, (identification, timestamp, ins, outs))
            connection.commit()
            print("Data inserted into database")
        except mysql.connector.Error as error:
            print(f"Failed to insert into emqx_messages: {error}")

    if message.topic == "LNU_Project/people_counter/notifications":
        print("Received message on: "+message.topic)
        payload = message.payload.decode("utf-8")
        print(payload)
        mqtt_data = json.loads(payload)
        
        identification = mqtt_data["identification"]
        timestamp = mqtt_data["timestamp"]
        description = mqtt_data["description"]
        
        try:
            cursor = connection.cursor()
            sql_insert_query = """
                INSERT INTO emqx_notifications (client_id, timestamp, description) 
                VALUES (%s, FROM_UNIXTIME(%s), %s)
            """
            cursor.execute(sql_insert_query, (identification, timestamp, description))
            connection.commit()
            print("Data inserted into database")
        except mysql.connector.Error as error:
            print(f"Failed to insert into emxq_notifications: {error}")

def on_log(client, userdata, level, buf):
    print("log: ", buf)

client = mqtt.Client("emqx_sQLSeRV", transport="websockets")

ca_cert_file = "/home/pi/broker.emqx.io-ca.crt" 
client.tls_set(ca_certs=ca_cert_file, tls_version=ssl.PROTOCOL_TLS)

client.on_connect = on_connect
client.on_message = on_message
client.on_log = on_log

client.reconnect_delay_set(min_delay=1, max_delay=15)

try:
    client.connect("broker.emqx.io", 8084, 60)
except Exception as e:
    print(f"Error connecting to MQTT broker: {e}")
    exit(1)

client.loop_forever()

