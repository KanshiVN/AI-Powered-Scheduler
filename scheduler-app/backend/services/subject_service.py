"""
Subject type detection and utility functions
"""

def detect_subject_type(subject_name):
    """
    Auto-detect subject type from name using keyword matching
    
    Args:
        subject_name (str): Name of the subject
        
    Returns:
        dict: {'type': str, 'duration_slots': int}
    """
    if not subject_name:
        return {'type': 'lecture', 'duration_slots': 1}
    
    name_lower = subject_name.lower()
    
    # Lab keywords
    lab_keywords = ['lab', 'laboratory', 'practical', 'workshop', 'hands-on']
    if any(keyword in name_lower for keyword in lab_keywords):
        return {'type': 'lab', 'duration_slots': 2}
    
    # Project keywords
    project_keywords = ['project', 'mini project', 'major project', 'capstone', 'thesis']
    if any(keyword in name_lower for keyword in project_keywords):
        return {'type': 'project', 'duration_slots': 2}
    
    # Default: lecture (theory subjects)
    return {'type': 'lecture', 'duration_slots': 1}


def validate_subject_type(subject_type):
    """Validate if subject type is valid"""
    valid_types = ['lecture', 'lab', 'project']
    return subject_type in valid_types


def validate_duration_slots(duration):
    """Validate if duration is within acceptable range"""
    try:
        duration_int = int(duration)
        return 1 <= duration_int <= 4
    except (ValueError, TypeError):
        return False
