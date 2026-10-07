# C:\project\EcoCity\dump_code.py
import os

# Файлы и папки, которые мы собираем
TARGET_DIR = os.path.join("backend", "app")
ENV_PY_PATH = os.path.join("backend", "alembic", "env.py")
INI_PATH = os.path.join("backend", "alembic.ini")
OUTPUT_FILE = "all_code.txt"

def collect_code():
    print("Сборка исходного кода проекта для анализа ошибок...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        # 1. Сначала запишем содержимое alembic.ini
        if os.path.exists(INI_PATH):
            out.write(f"=== FILE: {INI_PATH} ===\n")
            with open(INI_PATH, "r", encoding="utf-8") as f:
                out.write(f.read())
            out.write("\n\n" + "="*50 + "\n\n")
            
        # 2. Запишем содержимое env.py
        if os.path.exists(ENV_PY_PATH):
            out.write(f"=== FILE: {ENV_PY_PATH} ===\n")
            with open(ENV_PY_PATH, "r", encoding="utf-8") as f:
                out.write(f.read())
            out.write("\n\n" + "="*50 + "\n\n")

        # 3. Обходим дерево папок backend/app/
        if os.path.exists(TARGET_DIR):
            for root, _, files in os.walk(TARGET_DIR):
                # Игнорируем кэш питона
                if "__pycache__" in root:
                    continue
                    
                for file in files:
                    if file.endswith(".py"):
                        full_path = os.path.join(root, file)
                        out.write(f"=== FILE: {full_path} ===\n")
                        with open(full_path, "r", encoding="utf-8") as f:
                            out.write(f.read())
                        out.write("\n\n" + "="*50 + "\n\n")
                        
    print(f"Готово! Весь код объединен и сохранен в файл: {os.path.abspath(OUTPUT_FILE)}")

if __name__ == "__main__":
    collect_code()
