import streamlit as st
from src.analyze import load_stats, build_figure

st.set_page_config(page_title="Sports Analyzer", layout="centered")
st.title("Sports Analyzer")

show = st.button("Open graph")

if show:
    df = load_stats("data/sample_stats.csv")
    fig = build_figure(df, stat="points", window=3)
    st.pyplot(fig)