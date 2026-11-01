"""App Torneio Liga: visual da Liga da Justiça com as telas de torneio de areia 4x4."""
import os, runpy
os.environ["MARCA"] = "torneio"
runpy.run_path(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "liga", "apply.py"), run_name="__main__")
