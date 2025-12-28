import { supabase } from './supabase';

export const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) throw error;

    // create profile
    await supabase.from('profiles').insert({
        id: data.user?.id,
        name
    });

    return data;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;

    return data;
};

export const signOut = async () => {
    await supabase.auth.signOut();
};
