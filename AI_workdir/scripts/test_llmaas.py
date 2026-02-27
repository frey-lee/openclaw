from dotenv import load_dotenv
import os

load_dotenv()

from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LLMAAS_API_KEY"],
    base_url="https://llmaas.govtext.gov.sg/gateway",
)

completion = client.chat.completions.create(
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "hello"},
    ],
    model="gpt-4o",
)

print(completion.choices[0].message.content)
