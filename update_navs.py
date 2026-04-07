import os

dashboard_dir = r"c:\Users\PMLS\Desktop\Project_Blue\website\app\dashboard"

search_str1 = """              { href:"/dashboard", label:"Overview" },
              { href:"/dashboard/contracts", label:"Contracts" },
              { href:"/dashboard/profile", label:"Profile" },
              { href:"/dashboard/competitors", label:"Competitors" },
              { href:"/dashboard/team", label:"Team" },"""

replace_str1 = """              { href:"/dashboard", label:"Overview" },
              { href:"/dashboard/contracts", label:"Contracts" },
              { href:"/dashboard/profile", label:"Profile" },
              { href:"/dashboard/competitors", label:"Competitors" },
              { href:"/dashboard/forecasts", label:"AI Forecasts" },
              { href:"/dashboard/team", label:"Team" },"""

search_str2 = """              { href:"/dashboard/contracts",       label:"Contracts", icon:<FileText size={14} /> },
              { href:"/dashboard/profile",         label:"Profile",   icon:<Settings size={14} /> },
              { href:"/dashboard/competitors",     label:"Competitors", icon:<Shield size={14} /> },
              { href:"/dashboard/team",            label:"Team",      icon:<Users size={14} /> },"""

replace_str2 = """              { href:"/dashboard/contracts",       label:"Contracts", icon:<FileText size={14} /> },
              { href:"/dashboard/profile",         label:"Profile",   icon:<Settings size={14} /> },
              { href:"/dashboard/competitors",     label:"Competitors", icon:<Shield size={14} /> },
              { href:"/dashboard/forecasts",       label:"AI Forecasts", icon:<Zap size={14} /> },
              { href:"/dashboard/team",            label:"Team",      icon:<Users size={14} /> },"""

for root, dirs, files in os.walk(dashboard_dir):
    for file in files:
        if file.endswith(".tsx"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Simple replace mechanism
            new_content = content
            
            # If the nav link block was already updated, no-op
            if "label:\"AI Forecasts\"" not in new_content and "label:\"Team\"" in new_content:
                # Handle active state pages which might have `active:true` interpolated 
                # This is tricky because `search_str1` assumes exact match without active.
                pass
                
            # A more generic replace approach for the array
            # Find the `{ href:"/dashboard/competitors"` line, add the forecasts line right below it
            if "href:\"/dashboard/forecasts\"" not in new_content and "href:\"/dashboard/competitors\"" in new_content:
                lines = new_content.split("\n")
                new_lines = []
                for line in lines:
                    new_lines.append(line)
                    if "href:\"/dashboard/competitors\"" in line:
                        if "active" in line:
                            # Usually if we are on competitors page, the target is active
                            pass
                        # Let's just insert the generic one without active since it's not the forecasts page
                        if 'icon:<Shield' in line:
                            new_lines.append('              { href:"/dashboard/forecasts",       label:"AI Forecasts", icon:<Zap size={14} /> },')
                        else:
                            new_lines.append('              { href:"/dashboard/forecasts", label:"AI Forecasts" },')
                new_content = "\n".join(new_lines)
                
            if content != new_content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated nav in {file_path}")
